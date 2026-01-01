import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, amount, gameState } = body;

        if (!userId || !amount) {
            return NextResponse.json({ error: 'Missing userId or amount' }, { status: 400 });
        }

        // Only allow bets during waiting phase
        if (gameState !== 'waiting') {
            return NextResponse.json({ error: 'Bets only allowed during waiting phase' }, { status: 400 });
        }

        // Get user balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check balance
        if (profile.balance < amount) {
            return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
        }

        // Deduct balance
        const newBalance = profile.balance - amount;
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
        }

        // Create bet record
        const { data: bet, error: betError } = await supabase
            .from('bets')
            .insert({
                user_id: userId,
                amount: amount,
                status: 'placed'
            })
            .select()
            .single();

        if (betError) {
            // Rollback balance
            await supabase
                .from('profiles')
                .update({ balance: profile.balance })
                .eq('id', userId);

            console.error('Bet error:', betError);
            return NextResponse.json({ error: 'Failed to create bet' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            betId: bet.id,
            newBalance: newBalance
        });
    } catch (error) {
        console.error('Error placing bet:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
