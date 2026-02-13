import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTelegramChatId } from '@/lib/telegramSettings';

const BOT_TOKEN = process.env.BOT_TOKEN;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        let userId: string = '';
        let method: string = '';
        let amount: string = '';
        let file: File | null = null;
        let type: string = '';
        let cardNumber: string = '';
        let cardExpiry: string = '';

        // Handle both FormData and JSON
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            userId = formData.get('userId') as string || '';
            method = formData.get('method') as string || '';
            amount = formData.get('amount') as string || '';
            file = formData.get('file') as File | null;
        } else {
            const json = await request.json();
            userId = json.userId || '';
            method = json.method || '';
            amount = json.amount?.toString() || '';
            type = json.type || '';
            cardNumber = json.cardNumber || '';
            cardExpiry = json.cardExpiry || '';
        }

        const paymentsChatId = await getTelegramChatId('payments');

        if (!BOT_TOKEN || !paymentsChatId) {
            console.error('Telegram credentials not configured');
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        // Get short user_id from profiles
        let shortUserId = userId;
        if (userId) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('id', userId)
                    .single();
                if (profile?.user_id) {
                    shortUserId = profile.user_id;
                }
            } catch (err) {
                console.error('Error fetching user profile:', err);
            }
        }

        // Build message based on type
        const methodDisplay = method?.toUpperCase() || 'Nomalum';
        const amountDisplay = amount ? Number(amount).toLocaleString('uz-UZ') : '0';
        const dateDisplay = new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

        let message: string;
        if (type === 'withdraw') {
            message = `💸 *Pul chiqarish so'rovi!*

👤 *User ID:* \`${shortUserId}\`
💳 *Usul:* ${methodDisplay}
💵 *Summa:* ${amountDisplay} UZS
💳 *Karta:* \`${cardNumber}\`
📅 *Muddat:* ${cardExpiry}
📅 *Sana:* ${dateDisplay}`;
        } else {
            message = `💰 *Yangi to'lov so'rovi!*

👤 *User ID:* \`${shortUserId}\`
💳 *To'lov usuli:* ${methodDisplay}
💵 *Summa:* ${amountDisplay} UZS
📅 *Sana:* ${dateDisplay}

✅ *Foydalanuvchi to'lovni tasdiqladi*`;
        }

        // Send Telegram notification (non-blocking with timeout)
        const sendTelegramNotification = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            try {
                if (file) {
                    const fileBuffer = await file.arrayBuffer();
                    const blob = new Blob([fileBuffer], { type: file.type });

                    const telegramFormData = new FormData();
                    telegramFormData.append('chat_id', paymentsChatId);
                    telegramFormData.append('caption', message);
                    telegramFormData.append('parse_mode', 'Markdown');

                    if (file.type.startsWith('image/')) {
                        telegramFormData.append('photo', blob, file.name);
                        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                            method: 'POST',
                            body: telegramFormData,
                            signal: controller.signal
                        });
                    } else {
                        telegramFormData.append('document', blob, file.name);
                        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
                            method: 'POST',
                            body: telegramFormData,
                            signal: controller.signal
                        });
                    }
                } else {
                    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: paymentsChatId,
                            text: message,
                            parse_mode: 'Markdown'
                        }),
                        signal: controller.signal
                    });
                }
            } catch (err) {
                console.error('Telegram notification error:', err);
            } finally {
                clearTimeout(timeoutId);
            }
        };

        // Fire and forget - don't block the response
        sendTelegramNotification().catch(err => console.error('Telegram send failed:', err));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in payment notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
