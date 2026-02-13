import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTelegramChatId } from '@/lib/telegramSettings';

const BOT_TOKEN = process.env.BOT_TOKEN;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PaymentRequestRow = {
    id: string;
    user_id: string;
    method: string;
    amount: number;
    card_number: string;
    status: 'pending' | 'awaiting_review' | 'awaiting_confirmation' | 'completed' | 'expired' | 'cancelled' | string;
    expires_at: string;
};

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
        let paymentRequestId: string = '';

        // Handle both FormData and JSON
        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            userId = formData.get('userId') as string || '';
            method = formData.get('method') as string || '';
            amount = formData.get('amount') as string || '';
            file = formData.get('file') as File | null;
            paymentRequestId = formData.get('paymentRequestId') as string || '';
        } else {
            const json = await request.json();
            userId = json.userId || '';
            method = json.method || '';
            amount = json.amount?.toString() || '';
            type = json.type || '';
            cardNumber = json.cardNumber || '';
            cardExpiry = json.cardExpiry || '';
            paymentRequestId = json.paymentRequestId || '';
        }

        const isDepositRequest = type !== 'withdraw';
        let paymentRequest: PaymentRequestRow | null = null;
        let alreadySubmitted = false;

        if (isDepositRequest) {
            if (!paymentRequestId) {
                return NextResponse.json({ error: 'Payment request ID required' }, { status: 400 });
            }

            const { data: currentRequest, error: requestError } = await supabase
                .from('payment_requests')
                .select('id, user_id, method, amount, card_number, status, expires_at')
                .eq('id', paymentRequestId)
                .single();

            if (requestError || !currentRequest) {
                return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
            }

            paymentRequest = currentRequest as PaymentRequestRow;
            const nowIso = new Date().toISOString();
            const expiresAtMs = new Date(paymentRequest.expires_at).getTime();
            const isExpired = !Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now();

            if (isExpired) {
                if (paymentRequest.status !== 'expired') {
                    await supabase
                        .from('payment_requests')
                        .update({ status: 'expired' })
                        .eq('id', paymentRequest.id);
                }
                return NextResponse.json({
                    error: "To'lov so'rovi muddati tugagan",
                    status: 'expired',
                    expiresAt: paymentRequest.expires_at
                }, { status: 409 });
            }

            if (paymentRequest.status === 'awaiting_confirmation' || paymentRequest.status === 'awaiting_review') {
                alreadySubmitted = true;
            } else if (paymentRequest.status === 'pending') {
                const { data: lockedRows, error: lockError } = await supabase
                    .from('payment_requests')
                    .update({ status: 'awaiting_review' })
                    .eq('id', paymentRequest.id)
                    .eq('status', 'pending')
                    .gt('expires_at', nowIso)
                    .select('id, user_id, method, amount, card_number, status, expires_at')
                    .limit(1);

                if (lockError) {
                    console.error('Failed to lock payment request for Telegram send:', lockError);
                    return NextResponse.json({ error: 'Failed to process payment request' }, { status: 500 });
                }

                if (lockedRows && lockedRows.length > 0) {
                    paymentRequest = lockedRows[0] as PaymentRequestRow;
                } else {
                    const { data: latestRequest } = await supabase
                        .from('payment_requests')
                        .select('id, user_id, method, amount, card_number, status, expires_at')
                        .eq('id', paymentRequest.id)
                        .single();

                    if (!latestRequest) {
                        return NextResponse.json({ error: 'Payment request not found' }, { status: 404 });
                    }

                    paymentRequest = latestRequest as PaymentRequestRow;
                    const latestExpiresAtMs = new Date(paymentRequest.expires_at).getTime();
                    const latestExpired = !Number.isFinite(latestExpiresAtMs) || latestExpiresAtMs <= Date.now();

                    if (latestExpired || paymentRequest.status === 'expired') {
                        return NextResponse.json({
                            error: "To'lov so'rovi muddati tugagan",
                            status: 'expired',
                            expiresAt: paymentRequest.expires_at
                        }, { status: 409 });
                    }

                    if (paymentRequest.status === 'awaiting_confirmation' || paymentRequest.status === 'awaiting_review') {
                        alreadySubmitted = true;
                    } else {
                        return NextResponse.json({
                            error: `Payment request is already ${paymentRequest.status}`
                        }, { status: 409 });
                    }
                }
            } else {
                return NextResponse.json({
                    error: `Payment request is already ${paymentRequest.status}`
                }, { status: 409 });
            }

            method = paymentRequest.method;
            amount = paymentRequest.amount.toString();
        }

        if (alreadySubmitted) {
            return NextResponse.json({
                success: true,
                alreadySubmitted: true,
                status: paymentRequest?.status || 'awaiting_review',
                expiresAt: paymentRequest?.expires_at || null
            });
        }

        // Get short user_id from profiles
        let shortUserId = userId;
        const profileAuthId = paymentRequest?.user_id || userId;
        if (profileAuthId) {
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('user_id')
                    .eq('id', profileAuthId)
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
        const hasActionButtons = type !== 'withdraw' && !!paymentRequestId;
        const paymentsChatId = await getTelegramChatId('payments');

        if (!BOT_TOKEN || !paymentsChatId) {
            if (isDepositRequest && paymentRequest?.id) {
                await supabase
                    .from('payment_requests')
                    .update({ status: 'pending' })
                    .eq('id', paymentRequest.id)
                    .in('status', ['awaiting_review', 'awaiting_confirmation']);
            }
            console.error('Telegram credentials not configured');
            return NextResponse.json({ error: 'Telegram not configured' }, { status: 500 });
        }

        const paymentActionsMarkup = hasActionButtons
            ? {
                inline_keyboard: [[
                    {
                        text: '✅ Qabul qilish',
                        callback_data: `payment:approve:${paymentRequestId}`,
                        style: 'success'
                    },
                    {
                        text: '❌ Rad etish',
                        callback_data: `payment:reject:${paymentRequestId}`,
                        style: 'danger'
                    }
                ]]
            }
            : undefined;

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
🧾 *So'rov ID:* \`${paymentRequestId || '-'}\`
📅 *Sana:* ${dateDisplay}

✅ *Foydalanuvchi to'lovni tasdiqladi*`;
        }

        // Send Telegram notification with explicit Telegram API result checks
        const sendTelegramNotification = async (): Promise<{ ok: boolean; error?: string }> => {
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
                    if (paymentActionsMarkup) {
                        telegramFormData.append('reply_markup', JSON.stringify(paymentActionsMarkup));
                    }

                    let mediaResponse: Response;
                    if (file.type.startsWith('image/')) {
                        telegramFormData.append('photo', blob, file.name);
                        mediaResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
                            method: 'POST',
                            body: telegramFormData,
                            signal: controller.signal
                        });
                    } else {
                        telegramFormData.append('document', blob, file.name);
                        mediaResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
                            method: 'POST',
                            body: telegramFormData,
                            signal: controller.signal
                        });
                    }

                    const mediaJson = await mediaResponse.json().catch(() => null);
                    if (mediaResponse.ok && mediaJson?.ok) {
                        return { ok: true };
                    }

                    // If media upload failed, fallback to text message so admin still gets deposit alert.
                    const textFallbackResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: paymentsChatId,
                            text: `${message}\n\n⚠️ Chek faylini yuborib bo'lmadi`,
                            parse_mode: 'Markdown',
                            ...(paymentActionsMarkup ? { reply_markup: paymentActionsMarkup } : {})
                        }),
                        signal: controller.signal
                    });

                    const textFallbackJson = await textFallbackResponse.json().catch(() => null);
                    if (textFallbackResponse.ok && textFallbackJson?.ok) {
                        return { ok: true };
                    }

                    console.error('Telegram media and fallback text failed:', {
                        media: mediaJson,
                        fallback: textFallbackJson
                    });
                    return { ok: false, error: textFallbackJson?.description || mediaJson?.description || 'Telegram send failed' };
                } else {
                    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: paymentsChatId,
                            text: message,
                            parse_mode: 'Markdown',
                            ...(paymentActionsMarkup ? { reply_markup: paymentActionsMarkup } : {})
                        }),
                        signal: controller.signal
                    });

                    const json = await response.json().catch(() => null);
                    if (!response.ok || !json?.ok) {
                        console.error('Telegram text send failed:', json);
                        return { ok: false, error: json?.description || 'Telegram send failed' };
                    }

                    return { ok: true };
                }
            } catch (err) {
                console.error('Telegram notification error:', err);
                return { ok: false, error: 'Telegram notification error' };
            } finally {
                clearTimeout(timeoutId);
            }
        };

        const telegramResult = await sendTelegramNotification();
        if (!telegramResult.ok) {
            if (isDepositRequest && paymentRequest?.id) {
                await supabase
                    .from('payment_requests')
                    .update({ status: 'pending' })
                    .eq('id', paymentRequest.id)
                    .in('status', ['awaiting_review', 'awaiting_confirmation']);
            }
            return NextResponse.json({ error: telegramResult.error || 'Failed to send Telegram notification' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            status: paymentRequest?.status || (isDepositRequest ? 'awaiting_review' : 'sent'),
            expiresAt: paymentRequest?.expires_at || null
        });
    } catch (error) {
        console.error('Error in payment notification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
