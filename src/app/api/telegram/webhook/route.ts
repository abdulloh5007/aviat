import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

// Helper to send message
async function sendMessage(chatId: string, text: string) {
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

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();

        // Check for message
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true });
        }

        const message = update.message;
        const chatId = message.chat.id;
        const userId = message.from?.id?.toString();
        const text = message.text.trim();

        // Verify Admin
        if (userId !== ADMIN_ID) {
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
