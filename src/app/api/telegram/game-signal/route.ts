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

        // Determine signal strength
        let signalStrength = "🔴 Past";
        let recommendation = "⚠️ O'tkazib yuboring";

        if (multiplier >= 10) {
            signalStrength = "🟢 Juda Yuqori";
            recommendation = "✅ KATTA STAVKA";
        } else if (multiplier >= 5) {
            signalStrength = "🟢 Yuqori";
            recommendation = "✅ STAVKA QILING";
        } else if (multiplier >= 2) {
            signalStrength = "🟡 O'rta";
            recommendation = "✅ STAVKA QILING";
        } else if (multiplier >= 1.5) {
            signalStrength = "🟠 O'rtacha";
            recommendation = "⚡ Kichik stavka";
        }

        const message = `🛫 *KEYINGI RAUND SIGNALI*

🎯 Prognoz: *${multiplier.toFixed(2)}x*
📊 Signal: ${signalStrength}
💡 ${recommendation}

⏱ 5 sek ichida boshlaydi!`;

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
                    parse_mode: 'Markdown'
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
