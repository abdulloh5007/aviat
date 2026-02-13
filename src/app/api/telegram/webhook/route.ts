import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTelegramChatId } from '@/lib/telegramSettings';
import { approvePaymentRequest, rejectPaymentRequest } from '@/lib/paymentActions';
import { isAllowedTelegramAdmin } from '@/lib/telegramAdminIds';

const BOT_TOKEN = process.env.BOT_TOKEN;
const PAYMENT_CALLBACK_PREFIX = 'payment:';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper to send message
async function sendMessage(chatId: string | number, text: string) {
    if (!BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text }),
        });
    } catch (e) {
        console.error('Error sending message:', e);
    }
}

async function answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
    if (!BOT_TOKEN || !callbackQueryId) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                callback_query_id: callbackQueryId,
                text,
                show_alert: showAlert
            })
        });
    } catch (e) {
        console.error('Error answering callback query:', e);
    }
}

async function clearInlineButtons(chatId: string | number, messageId: number) {
    if (!BOT_TOKEN) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageReplyMarkup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
                reply_markup: { inline_keyboard: [] }
            })
        });
    } catch (e) {
        console.error('Error clearing inline buttons:', e);
    }
}

async function markPaymentMessageProcessed(message: any, statusLine: string) {
    if (!BOT_TOKEN || !message?.chat?.id || !message?.message_id) return;

    const chatId = message.chat.id;
    const messageId = message.message_id;

    try {
        if (typeof message.caption === 'string') {
            const nextCaption = message.caption.includes(statusLine)
                ? message.caption
                : `${message.caption}\n\n${statusLine}`;

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageCaption`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    caption: nextCaption
                })
            });
            return;
        }

        if (typeof message.text === 'string') {
            const nextText = message.text.includes(statusLine)
                ? message.text
                : `${message.text}\n\n${statusLine}`;

            await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    message_id: messageId,
                    text: nextText
                })
            });
        }
    } catch (e) {
        console.error('Error marking payment message status:', e);
    }
}

function parsePaymentCallbackData(data: string | undefined): { action: 'approve' | 'reject'; paymentId: string } | null {
    if (!data || !data.startsWith(PAYMENT_CALLBACK_PREFIX)) {
        return null;
    }

    const parts = data.split(':');
    if (parts.length < 3) {
        return null;
    }

    const action = parts[1];
    const paymentId = parts.slice(2).join(':');

    if (!paymentId || (action !== 'approve' && action !== 'reject')) {
        return null;
    }

    return { action, paymentId };
}

async function handlePaymentCallback(update: any) {
    const callback = update.callback_query;
    if (!callback) return;

    const callbackId = callback.id as string;
    const callbackData = parsePaymentCallbackData(callback.data as string | undefined);
    if (!callbackData) {
        await answerCallbackQuery(callbackId, 'Noto\'g\'ri action');
        return;
    }

    const callbackUserId = callback.from?.id?.toString();
    const isAllowedAdmin = await isAllowedTelegramAdmin(callbackUserId);
    if (!isAllowedAdmin) {
        await answerCallbackQuery(callbackId, 'Нет прав', true);
        return;
    }

    const configuredPaymentsChatId = await getTelegramChatId('payments');
    const callbackChatId = callback.message?.chat?.id?.toString();
    if (configuredPaymentsChatId && callbackChatId && configuredPaymentsChatId !== callbackChatId) {
        await answerCallbackQuery(callbackId, 'Noto\'g\'ri chat', true);
        return;
    }

    const messageChatId = callback.message?.chat?.id;
    const messageId = callback.message?.message_id;
    if (callbackData.action === 'approve') {
        const result = await approvePaymentRequest(callbackData.paymentId);
        if (!result.ok) {
            await answerCallbackQuery(callbackId, result.error, true);
            return;
        }

        const processedLine = result.state === 'already_completed'
            ? '✅ Статус: Уже принято'
            : '✅ Статус: Принято';

        await answerCallbackQuery(callbackId, 'Принято');

        if (messageChatId && messageId) {
            await clearInlineButtons(messageChatId, messageId);
            await markPaymentMessageProcessed(callback.message, processedLine);
        }
        return;
    }

    const result = await rejectPaymentRequest(callbackData.paymentId);
    if (!result.ok) {
        await answerCallbackQuery(callbackId, result.error, true);
        return;
    }

    const processedLine = result.state === 'already_cancelled'
        ? '❌ Статус: Уже отклонено'
        : '❌ Статус: Отклонено';

    await answerCallbackQuery(callbackId, 'Отклонено');

    if (messageChatId && messageId) {
        await clearInlineButtons(messageChatId, messageId);
        await markPaymentMessageProcessed(callback.message, processedLine);
    }
}

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();

        if (update.callback_query) {
            await handlePaymentCallback(update);
            return NextResponse.json({ ok: true });
        }

        // Check for message
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true });
        }

        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from?.id?.toString();
        const text = message.text.trim();

        // Verify Admin
        const isAllowedAdmin = await isAllowedTelegramAdmin(userId);
        if (!isAllowedAdmin) {
            console.log(`Unauthorized command attempt from ${userId}`);
            // Optionally ignore or reply unauthorized
            return NextResponse.json({ ok: true });
        }

        if (text === '/up') {
            // Set high odds
            const { error } = await supabase
                .from('game_settings')
                .upsert({ key: 'game_odds_mode', value: 'high' }, { onConflict: 'key' });

            if (error) {
                console.error('DB Error:', error);
                await sendMessage(chatId, '❌ Xatolik yuz berdi');
            } else {
                await sendMessage(chatId, '🚀 Shanslar ko\'tarildi \u2191');
            }
        } else if (text === '/current') {
            // Set normal odds
            const { error } = await supabase
                .from('game_settings')
                .upsert({ key: 'game_odds_mode', value: 'normal' }, { onConflict: 'key' });

            if (error) {
                console.error('DB Error:', error);
                await sendMessage(chatId, '❌ Xatolik yuz berdi');
            } else {
                await sendMessage(chatId, '🔄 Shanslar o\'z holiga qaytdi \u21BA');
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
