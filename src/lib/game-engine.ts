import { createClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';
import { createServer } from 'http';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// WebSocket Server Setup
const httpServer = createServer();
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const WS_PORT = 3001;

// Game constants
const COUNTDOWN_DURATION = 5;
const MULTIPLIER_INCREMENT = 0.01;
const UPDATE_INTERVAL = 50; // Can be fast now - no DB bottleneck!

// Get current odds mode from database (called once per round)
async function getOddsMode(): Promise<'normal' | 'high'> {
    try {
        const { data } = await supabase
            .from('game_settings')
            .select('value')
            .eq('key', 'game_odds_mode')
            .single();
        return (data?.value as 'normal' | 'high') || 'normal';
    } catch {
        return 'normal';
    }
}

// Weighted multiplier generation based on mode
function generateTargetMultiplier(mode: 'normal' | 'high' = 'normal'): number {
    const rand = Math.random() * 100;

    if (mode === 'high') {
        // High mode: better odds for players
        if (rand < 1) return 1.00;           // 1% instant crash (was 3%)
        if (rand < 5) return 1.01 + Math.random() * 0.49;  // 4% (was 15%)
        if (rand < 15) return 1.5 + Math.random() * 0.5;   // 10% (was 25%)
        if (rand < 35) return 2 + Math.random() * 1;       // 20% 
        if (rand < 55) return 3 + Math.random() * 2;       // 20%
        if (rand < 75) return 5 + Math.random() * 5;       // 20%
        if (rand < 90) return 10 + Math.random() * 40;     // 15%
        return 50 + Math.random() * 50;                     // 10% big wins!
    }

    // Normal mode: house edge
    if (rand < 3) return 1.00;
    if (rand < 18) return 1.01 + Math.random() * 0.49;
    if (rand < 43) return 1.5 + Math.random() * 0.5;
    if (rand < 68) return 2 + Math.random() * 1;
    if (rand < 83) return 3 + Math.random() * 2;
    if (rand < 93) return 5 + Math.random() * 5;
    if (rand < 98) return 10 + Math.random() * 40;
    return 50 + Math.random() * 50;
}

interface GameState {
    round_id: number;
    game_state: 'waiting' | 'flying' | 'crashed';
    current_multiplier: number;
    target_multiplier: number;
    countdown_seconds: number;
}

class GameEngine {
    private state: GameState;
    private signalSent: boolean = false;

    constructor() {
        this.state = {
            round_id: 1,
            game_state: 'waiting',
            current_multiplier: 1.00,
            target_multiplier: generateTargetMultiplier(),
            countdown_seconds: COUNTDOWN_DURATION
        };
    }

    getState() {
        return { ...this.state };
    }

    broadcast() {
        io.emit('gameState', this.state);
    }

    async sendTelegramSignal() {
        if (this.signalSent) return;
        this.signalSent = true;

        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            await fetch(`${baseUrl}/api/telegram/game-signal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ multiplier: this.state.target_multiplier })
            });
            console.log(`📢 Signal: ${this.state.target_multiplier}x`);
        } catch (e) {
            console.error('Telegram error:', e);
        }
    }

    async saveToHistory() {
        await supabase.from('game_rounds').insert({
            multiplier: this.state.target_multiplier
        });
    }

    sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async run() {
        console.log('🎮 Game Engine started');
        console.log(`🌐 WebSocket server on port ${WS_PORT}`);

        while (true) {
            switch (this.state.game_state) {
                case 'waiting':
                    await this.handleWaiting();
                    break;
                case 'flying':
                    await this.handleFlying();
                    break;
                case 'crashed':
                    await this.handleCrashed();
                    break;
            }
        }
    }

    async handleWaiting() {
        // Send signal at start of waiting
        await this.sendTelegramSignal();

        // Countdown
        while (this.state.countdown_seconds > 0) {
            this.broadcast();
            await this.sleep(1000);
            this.state.countdown_seconds--;
        }

        // Start flying
        this.state.game_state = 'flying';
        this.state.current_multiplier = 1.00;
        console.log(`🛫 Round ${this.state.round_id} | Target: ${this.state.target_multiplier.toFixed(2)}x`);
    }

    async handleFlying() {
        while (this.state.current_multiplier < this.state.target_multiplier) {
            this.state.current_multiplier = parseFloat(
                (this.state.current_multiplier + MULTIPLIER_INCREMENT).toFixed(2)
            );
            this.broadcast();
            await this.sleep(UPDATE_INTERVAL);
        }

        // Crash
        this.state.current_multiplier = this.state.target_multiplier;
        this.state.game_state = 'crashed';
        this.broadcast();

        console.log(`💥 Round ${this.state.round_id} crashed at ${this.state.target_multiplier}x`);
        await this.saveToHistory();
    }

    async handleCrashed() {
        // Wait 3 seconds
        await this.sleep(3000);

        // Get odds mode from DB (only 1 query per round)
        const mode = await getOddsMode();

        // New round
        this.state.round_id++;
        this.state.game_state = 'waiting';
        this.state.current_multiplier = 1.00;
        this.state.target_multiplier = parseFloat(generateTargetMultiplier(mode).toFixed(2));
        this.state.countdown_seconds = COUNTDOWN_DURATION;
        this.signalSent = false;

        console.log(`🔄 Round ${this.state.round_id} (mode: ${mode})`);
    }
}

// Socket.IO connection handling
const engine = new GameEngine();

io.on('connection', (socket) => {
    console.log(`👤 Client connected: ${socket.id}`);

    // Send current state to new client
    socket.emit('gameState', engine.getState());

    socket.on('disconnect', () => {
        console.log(`👋 Client disconnected: ${socket.id}`);
    });
});

// Start servers
httpServer.listen(WS_PORT, () => {
    console.log(`✅ WebSocket server running on ws://localhost:${WS_PORT}`);
    engine.run();
});

// Handle shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    httpServer.close();
    process.exit(0);
});
