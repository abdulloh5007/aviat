/**
 * Game Loop Manager
 * 
 * Этот скрипт управляет раундами игры. Запустите его на сервере/VPS.
 * 
 * Использование:
 *   node scripts/game-loop.js
 * 
 * Убедитесь что в .env есть:
 *   GAME_ADMIN_KEY=ваш_секретный_ключ
 *   API_URL=https://your-site.vercel.app
 */

// Загрузить .env
require('dotenv').config();

const GAME_ADMIN_KEY = process.env.GAME_ADMIN_KEY;
const API_URL = process.env.API_URL || 'http://localhost:3000';

const WAITING_DURATION = 5000; // 5 секунд ожидания
const TICK_INTERVAL = 100;     // Обновление каждые 100ms
const CRASHED_DURATION = 3000; // 3 секунды показа результата

async function callApi(action) {
    try {
        const response = await fetch(`${API_URL}/api/game/state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, adminKey: GAME_ADMIN_KEY })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error.message);
        return null;
    }
}

async function getState() {
    try {
        const response = await fetch(`${API_URL}/api/game/state`);
        const data = await response.json();
        return data.state;
    } catch (error) {
        console.error('Error getting state:', error.message);
        return null;
    }
}

// Отправка сигнала в Telegram во время фазы ожидания
async function sendSignal(crashPoint) {
    try {
        await fetch(`${API_URL}/api/telegram/game-signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ multiplier: crashPoint })
        });
        console.log(`📡 Signal sent: ${crashPoint}x`);
    } catch (error) {
        console.error('Signal error:', error.message);
    }
}

// Сохранение истории раунда в БД
async function saveRoundHistory(multiplier) {
    try {
        await fetch(`${API_URL}/api/game/history`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ multiplier, adminKey: GAME_ADMIN_KEY })
        });
        console.log(`📊 History saved: ${multiplier}x`);
    } catch (error) {
        console.error('History save error:', error.message);
    }
}

async function gameLoop() {
    console.log('🎮 Starting game loop...');
    console.log(`   API URL: ${API_URL}`);

    let lastRoundId = 0;
    let lastCrashedRound = 0;
    let state = await getState();

    if (!state) {
        console.log('⚠️ No game state found, creating...');
        const created = await callApi('next');
        state = created?.state || null;
        await sleep(1000);
    }

    while (true) {
        if (!state) {
            console.log('⚠️ No game state found, creating...');
            const recreated = await callApi('next');
            state = recreated?.state || null;
            await sleep(1000);
            continue;
        }

        switch (state.phase) {
            case 'waiting':
                // Отправляем сигнал только один раз за раунд
                if (state.round_id !== lastRoundId && state.crash_point) {
                    lastRoundId = state.round_id;
                    console.log(`⏳ Round ${state.round_id}: Waiting... (crash at ${state.crash_point}x)`);
                    // Отправить сигнал в начале ожидания
                    sendSignal(state.crash_point);
                }

                // Если цикл перезапущен в середине waiting, ждём только остаток
                const waitingStartedAt = new Date(state.phase_start_at).getTime();
                const waitingElapsed = Date.now() - waitingStartedAt;
                const waitingRemaining = Math.max(0, WAITING_DURATION - waitingElapsed);
                await sleep(waitingRemaining);

                const started = await callApi('start');
                state = started?.state || await getState();
                if (state?.phase === 'flying') {
                    console.log(`🚀 Round ${state.round_id}: Started!`);
                }
                break;

            case 'flying':
                const result = await callApi('tick');
                state = result?.state || state;

                if (state.phase === 'crashed') {
                    const crashedMultiplier = state.multiplier;
                    console.log(`💥 Round ${state.round_id}: Crashed at ${crashedMultiplier}x`);

                    // Сохранить в историю только один раз
                    if (state.round_id !== lastCrashedRound) {
                        lastCrashedRound = state.round_id;
                        saveRoundHistory(crashedMultiplier);
                    }
                }
                await sleep(TICK_INTERVAL);
                break;

            case 'crashed':
                // Если цикл перезапущен в середине crashed, ждём только остаток
                const crashedStartedAt = new Date(state.phase_start_at).getTime();
                const crashedElapsed = Date.now() - crashedStartedAt;
                const crashedRemaining = Math.max(0, CRASHED_DURATION - crashedElapsed);
                await sleep(crashedRemaining);

                const nextRound = await callApi('next');
                state = nextRound?.state || await getState();
                console.log(`\n📍 Starting new round...`);
                break;

            default:
                state = await getState();
                await sleep(300);
                break;
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Запуск
if (!GAME_ADMIN_KEY) {
    console.error('❌ GAME_ADMIN_KEY not set!');
    console.log('Usage: Add GAME_ADMIN_KEY to .env file');
    process.exit(1);
}

gameLoop().catch(console.error);
