import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { userId, phone, email, country, currency } = data;

        if (!BOT_TOKEN || !GROUP_ID) {
            console.error('Telegram credentials not configured');
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const message = `🆕 *Yangi ro'yxatdan o'tish!*

👤 *User ID:* \`${userId}\`
📱 *Telefon:* ${phone || 'Kiritilmagan'}
📧 *Email:* ${email || 'Kiritilmagan'}
🌍 *Mamlakat:* ${country || 'Noma\'lum'}
💰 *Valyuta:* ${currency || 'Noma\'lum'}
📅 *Sana:* ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

        const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: GROUP_ID,
                text: message,
                parse_mode: 'Markdown',
            }),
        });

        const result = await response.json();

        if (!result.ok) {
            console.error('Telegram API error:', result);
            return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending registration notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
