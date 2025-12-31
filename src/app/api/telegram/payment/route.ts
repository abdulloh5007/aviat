import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const userId = formData.get('userId') as string;
        const method = formData.get('method') as string;
        const amount = formData.get('amount') as string;
        const file = formData.get('file') as File | null;

        if (!BOT_TOKEN || !GROUP_ID) {
            console.error('Telegram credentials not configured');
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const message = `💰 *Yangi to'lov so'rovi!*

👤 *User ID:* \`${userId}\`
💳 *To'lov usuli:* ${method?.toUpperCase() || 'Noma\'lum'}
💵 *Summa:* ${amount ? Number(amount).toLocaleString('uz-UZ') : '0'} UZS
📅 *Sana:* ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}

✅ *Foydalanuvchi to'lovni tasdiqladi*`;

        // If file is provided, send with photo/document
        if (file) {
            const fileBuffer = await file.arrayBuffer();
            const blob = new Blob([fileBuffer], { type: file.type });

            const telegramFormData = new FormData();
            telegramFormData.append('chat_id', GROUP_ID);
            telegramFormData.append('caption', message);
            telegramFormData.append('parse_mode', 'Markdown');

            // Check if it's an image or document
            if (file.type.startsWith('image/')) {
                telegramFormData.append('photo', blob, file.name);
                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                    method: 'POST',
                    body: telegramFormData,
                });
                const result = await response.json();
                if (!result.ok) {
                    console.error('Telegram API error:', result);
                    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
                }
            } else {
                telegramFormData.append('document', blob, file.name);
                const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
                    method: 'POST',
                    body: telegramFormData,
                });
                const result = await response.json();
                if (!result.ok) {
                    console.error('Telegram API error:', result);
                    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
                }
            }
        } else {
            // Send just the message if no file
            const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
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
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending payment notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
