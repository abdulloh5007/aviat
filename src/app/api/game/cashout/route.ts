import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, betId, multiplier, gameState } = body;

        if (!userId || !betId || !multiplier) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Only allow cashout during flying phase
        if (gameState !== 'flying') {
            return NextResponse.json({ error: 'Cashout only allowed during flying phase' }, { status: 400 });
        }

        // Get bet
        const { data: bet, error: betError } = await supabase
            .from('bets')
            .select('*')
            .eq('id', betId)
            .eq('user_id', userId)
            .eq('status', 'placed')
            .single();

        if (betError || !bet) {
            return NextResponse.json({ error: 'Bet not found or already processed' }, { status: 404 });
        }

        // Calculate winnings
        const winAmount = parseFloat((bet.amount * multiplier).toFixed(2));

        // Update bet status
        const { error: updateBetError } = await supabase
            .from('bets')
            .update({
                status: 'won',
                cashout_multiplier: multiplier,
                win_amount: winAmount
            })
            .eq('id', betId);

        if (updateBetError) {
            return NextResponse.json({ error: 'Failed to update bet' }, { status: 500 });
        }

        // Add winnings to balance
        const { data: profile } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        const newBalance = (profile?.balance || 0) + winAmount;

        const { error: updateBalanceError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId);

        if (updateBalanceError) {
            return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            winAmount: winAmount,
            newBalance: newBalance
        });
    } catch (error) {
        console.error('Error cashing out:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
