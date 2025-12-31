import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ANALYSIS_ID = process.env.GROUP_ANALYSIS_ID;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { multiplier } = body;

        console.log('Signal request received:', { multiplier, GROUP_ANALYSIS_ID });

        if (!BOT_TOKEN || !GROUP_ANALYSIS_ID) {
            console.error('Telegram credentials not configured');
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        // Determine recommendation
        const isGoodBet = multiplier >= 1.50;
        const recommendation = isGoodBet
            ? "✅ *Tavsiya:* STAVKA QILING"
            : "❌ *Tavsiya:* O'TKAZIB YUBORING";

        // Construct the message
        const message = `🚀 *AVIATOR SIGNAL* 🚀

🎯 *Kutilayotgan natija:* ${multiplier.toFixed(2)}x

${recommendation}
`;

        // Load the image
        // We'll use the 'plane.png' from public/AviatorWinn_files/plane.png 
        // Note: In Next.js server actions, process.cwd() is the root of the project
        const imagePath = path.join(process.cwd(), 'public', 'AviatorWinn_files', 'plane.png');

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            console.error('Image file not found:', imagePath);
            // Fallback to text only if image fails, but better to fail or let user know
            // For now try to send without image or error? 
            // Let's try to send simple message if image missing
        }

        const fileBuffer = fs.readFileSync(imagePath);
        const blob = new Blob([fileBuffer], { type: 'image/png' });

        const telegramFormData = new FormData();
        telegramFormData.append('chat_id', GROUP_ANALYSIS_ID);
        telegramFormData.append('caption', message);
        telegramFormData.append('parse_mode', 'Markdown');
        telegramFormData.append('photo', blob, 'plane.png');

        console.log('Sending photo to Telegram...');
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: telegramFormData,
        });

        const result = await response.json();

        if (!result.ok) {
            console.error('Telegram API error:', result);
            return NextResponse.json({ error: 'Failed to send notification', details: result }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending signal notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
