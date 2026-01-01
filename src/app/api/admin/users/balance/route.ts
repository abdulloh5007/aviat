import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GAME_ADMIN_ID = process.env.GAME_ADMIN_ID;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminUserId, targetUserId, newBalance, action, amount } = body;

        // Verify admin
        if (!adminUserId || adminUserId !== GAME_ADMIN_ID) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!targetUserId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        // Get current balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', targetUserId)
            .single();

        if (profileError || !profile) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        let finalBalance: number;

        if (action === 'add') {
            finalBalance = profile.balance + (amount || 0);
        } else if (action === 'subtract') {
            finalBalance = Math.max(0, profile.balance - (amount || 0));
        } else if (newBalance !== undefined) {
            finalBalance = Math.max(0, newBalance);
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Update balance
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: finalBalance })
            .eq('id', targetUserId);

        if (updateError) {
            console.error('Error updating balance:', updateError);
            return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            newBalance: finalBalance
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
