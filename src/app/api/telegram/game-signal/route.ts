import { NextRequest, NextResponse } from 'next/server';
import { getTelegramChatId } from '@/lib/telegramSettings';

const BOT_TOKEN = process.env.BOT_TOKEN;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { multiplier } = body;
        const analysisChatId = await getTelegramChatId('analysis');

        if (!BOT_TOKEN || !analysisChatId) {
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const message = `Aviator o'yini uchun bepul signal
Keyingi aylanma natijasi ${multiplier.toFixed(2)}x

Bu signallar faqat <a href="https://aviatorz.bounceme.net/">aviatorwinn.com</a> o'yini uchun maxsuslangan`;

        // Send text message with AbortController timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

        try {
            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: analysisChatId,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true
                }),
                signal: controller.signal
            });
        } catch {
            // Timeout or network error - ignore silently to prevent lag
        } finally {
            clearTimeout(timeoutId);
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
