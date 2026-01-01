import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const BOT_TOKEN = process.env.BOT_TOKEN;
const GROUP_ID = process.env.GROUP_ID;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, method, amount, cardNumber, cardExpiry } = body;

        if (!userId || !method || !amount || !cardNumber) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check user balance and get user_id (short ID)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance, id, user_id')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (profile.balance < amount) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        // Deduct balance immediately (optimistic)
        const newBalance = profile.balance - amount;
        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId);

        if (balanceError) {
            console.error('Error updating balance:', balanceError);
            return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
        }

        // Create withdrawal request
        const { data: withdrawal, error: insertError } = await supabase
            .from('withdraw_requests')
            .insert({
                user_id: userId,
                method,
                amount,
                card_number: cardNumber,
                card_expiry: cardExpiry || '',
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error creating withdrawal:', insertError);
            // Rollback balance
            await supabase
                .from('profiles')
                .update({ balance: profile.balance })
                .eq('id', userId);
            return NextResponse.json({ error: 'Failed to create withdrawal' }, { status: 500 });
        }

        // Send notification to Telegram (non-blocking)
        if (BOT_TOKEN && GROUP_ID) {
            const shortUserId = profile.user_id || 'Unknown';
            const message = `💸 *Pul chiqarish so'rovi!*

👤 *User ID:* \`${shortUserId}\`
💳 *Usul:* ${method?.toUpperCase() || 'Nomalum'}
💵 *Summa:* ${amount.toLocaleString('uz-UZ')} UZS
💳 *Karta:* \`${cardNumber}\`
📅 *Muddat:* ${cardExpiry || '-'}
📅 *Sana:* ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

            // Fire and forget - don't await
            fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: GROUP_ID,
                    text: message,
                    parse_mode: 'Markdown'
                })
            }).catch(err => console.error('Telegram notification failed:', err));
        }

        return NextResponse.json({
            success: true,
            withdrawal,
            newBalance
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
