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

type TelegramApiResult = {
    ok: boolean;
    description?: string;
};

async function callTelegramApi(method: string, payload: Record<string, unknown>): Promise<TelegramApiResult> {
    if (!BOT_TOKEN) {
        return { ok: false, description: 'BOT_TOKEN not configured' };
    }

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const raw = await response.text().catch(() => '');
        let json: any = null;
        try {
            json = raw ? JSON.parse(raw) : null;
        } catch {
            json = null;
        }

        if (response.ok && json?.ok) {
            return { ok: true };
        }

        const description = json?.description || `HTTP ${response.status}`;
        console.error(`Telegram API ${method} failed:`, {
            status: response.status,
            body: json || raw
        });
        return { ok: false, description };
    } catch (error) {
        console.error(`Telegram API ${method} request error:`, error);
        return { ok: false, description: 'Telegram request failed' };
    }
}

// Helper to send message
async function sendMessage(chatId: string | number, text: string): Promise<boolean> {
    const result = await callTelegramApi('sendMessage', { chat_id: chatId, text });
    return result.ok;
}

async function answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false): Promise<boolean> {
    if (!callbackQueryId) return false;
    const result = await callTelegramApi('answerCallbackQuery', {
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert
    });
    return result.ok;
}

async function clearInlineButtons(chatId: string | number, messageId: number): Promise<boolean> {
    const result = await callTelegramApi('editMessageReplyMarkup', {
        chat_id: chatId,
        message_id: messageId,
        reply_markup: { inline_keyboard: [] }
    });
    return result.ok;
}

async function markPaymentMessageProcessed(message: any, statusLine: string): Promise<boolean> {
    if (!message?.chat?.id || !message?.message_id) return false;

    const chatId = message.chat.id;
    const messageId = message.message_id;

    try {
        if (typeof message.caption === 'string') {
            const nextCaption = message.caption.includes(statusLine)
                ? message.caption
                : `${message.caption}\n\n${statusLine}`;

            const result = await callTelegramApi('editMessageCaption', {
                chat_id: chatId,
                message_id: messageId,
                caption: nextCaption
            });
            return result.ok;
        }

        if (typeof message.text === 'string') {
            const nextText = message.text.includes(statusLine)
                ? message.text
                : `${message.text}\n\n${statusLine}`;

            const result = await callTelegramApi('editMessageText', {
                chat_id: chatId,
                message_id: messageId,
                text: nextText
            });
            return result.ok;
        }

        return false;
    } catch (e) {
        console.error('Error marking payment message status:', e);
        return false;
    }
}

function parsePaymentCallbackData(data: string | undefined): { action: 'approve' | 'reject'; paymentId: string } | null {
    if (!data) {
        return null;
    }

    // Current format: payment:approve:<paymentId>
    if (data.startsWith(PAYMENT_CALLBACK_PREFIX)) {
        const parts = data.split(':');
        if (parts.length >= 3) {
            const action = parts[1];
            const paymentId = parts.slice(2).join(':');
            if (paymentId && (action === 'approve' || action === 'reject')) {
                return { action, paymentId };
            }
        }
    }

    // Legacy compatibility:
    // approve:<paymentId> / reject:<paymentId>
    if (data.startsWith('approve:') || data.startsWith('reject:')) {
        const [action, ...rest] = data.split(':');
        const paymentId = rest.join(':');
        if (paymentId && (action === 'approve' || action === 'reject')) {
            return { action, paymentId };
        }
    }

    // Legacy compatibility:
    // payment_approve_<paymentId> / payment_reject_<paymentId>
    if (data.startsWith('payment_approve_')) {
        return { action: 'approve', paymentId: data.replace('payment_approve_', '') };
    }
    if (data.startsWith('payment_reject_')) {
        return { action: 'reject', paymentId: data.replace('payment_reject_', '') };
    }

    // Legacy compatibility:
    // approve_<paymentId> / reject_<paymentId>
    if (data.startsWith('approve_')) {
        return { action: 'approve', paymentId: data.replace('approve_', '') };
    }
    if (data.startsWith('reject_')) {
        return { action: 'reject', paymentId: data.replace('reject_', '') };
    }

    return null;
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

    console.info('Payment callback received', {
        callbackUserId: callback.from?.id?.toString(),
        action: callbackData.action,
        paymentId: callbackData.paymentId,
        callbackChatId: callback.message?.chat?.id?.toString() || null,
        messageId: callback.message?.message_id || null
    });

    const callbackUserId = callback.from?.id?.toString();
    const isAllowedAdmin = await isAllowedTelegramAdmin(callbackUserId);
    if (!isAllowedAdmin) {
        await answerCallbackQuery(callbackId, 'Нет прав', true);
        return;
    }

    // Acknowledge quickly to avoid Telegram BOT_RESPONSE_TIMEOUT on slower DB calls.
    const acknowledged = await answerCallbackQuery(callbackId, 'Обрабатываю...');
    if (!acknowledged) {
        console.warn('Failed to answer callback query in time', { callbackId });
    }

    const configuredPaymentsChatId = await getTelegramChatId('payments');
    const callbackChatId = callback.message?.chat?.id?.toString();
    if (configuredPaymentsChatId && callbackChatId && configuredPaymentsChatId !== callbackChatId) {
        // Allow legacy buttons from old chats after chat_id rotation.
        // Admin check still protects who can process callbacks.
        console.warn(`Legacy callback chat detected: ${callbackChatId}, current payments chat: ${configuredPaymentsChatId}`);
    }

    const messageChatId = callback.message?.chat?.id;
    const messageId = callback.message?.message_id;
    if (callbackData.action === 'approve') {
        const result = await approvePaymentRequest(callbackData.paymentId);
        if (!result.ok) {
            if (messageChatId) {
                await sendMessage(messageChatId, `❌ ${result.error}`);
            }
            console.warn('Approve payment callback failed', {
                paymentId: callbackData.paymentId,
                error: result.error
            });
            return;
        }

        const processedLine = result.state === 'already_completed'
            ? '✅ Статус: Уже принято'
            : '✅ Статус: Принято';

        if (messageChatId && messageId) {
            const buttonsCleared = await clearInlineButtons(messageChatId, messageId);
            const statusMarked = await markPaymentMessageProcessed(callback.message, processedLine);
            if (!buttonsCleared || !statusMarked) {
                await sendMessage(messageChatId, processedLine);
            }
        }
        console.info('Approve payment callback succeeded', {
            paymentId: callbackData.paymentId,
            resultState: result.state
        });
        return;
    }

    const result = await rejectPaymentRequest(callbackData.paymentId);
    if (!result.ok) {
        if (messageChatId) {
            await sendMessage(messageChatId, `❌ ${result.error}`);
        }
        console.warn('Reject payment callback failed', {
            paymentId: callbackData.paymentId,
            error: result.error
        });
        return;
    }

    const processedLine = result.state === 'already_cancelled'
        ? '❌ Статус: Уже отклонено'
        : '❌ Статус: Отклонено';

    if (messageChatId && messageId) {
        const buttonsCleared = await clearInlineButtons(messageChatId, messageId);
        const statusMarked = await markPaymentMessageProcessed(callback.message, processedLine);
        if (!buttonsCleared || !statusMarked) {
            await sendMessage(messageChatId, processedLine);
        }
    }
    console.info('Reject payment callback succeeded', {
        paymentId: callbackData.paymentId,
        resultState: result.state
    });
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text();
        if (!rawBody || !rawBody.trim()) {
            return NextResponse.json({ ok: true });
        }

        let update: any = null;
        try {
            update = JSON.parse(rawBody);
        } catch {
            console.warn('Webhook received non-JSON payload');
            return NextResponse.json({ ok: true });
        }

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

export async function GET() {
    return NextResponse.json({ ok: true });
}
