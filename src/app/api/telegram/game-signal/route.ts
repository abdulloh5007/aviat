import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ANALYSIS_ID = process.env.GROUP_ANALYSIS_ID;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { multiplier } = body;

        if (!BOT_TOKEN || !GROUP_ANALYSIS_ID) {
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const message = `Aviator o'yini uchun bepul signal
Keyingi aylanma natijasi ${multiplier.toFixed(2)}x

Bu signallar faqat <a href="https://aviator-kazino.vercel.app/">aviatorwin.com</a> o'yini uchun maxsuslangan`;

        // Send text message with AbortController timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: GROUP_ANALYSIS_ID,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                }),
                signal: controller.signal
            });
        } catch (fetchError) {
            // Timeout or network error - ignore silently to prevent lag
        } finally {
            clearTimeout(timeoutId);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
