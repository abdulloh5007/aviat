import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Mark bets as lost when game crashes
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { betIds } = body;

        if (!betIds || !Array.isArray(betIds) || betIds.length === 0) {
            return NextResponse.json({ success: true }); // Nothing to do
        }

        // Mark all uncashed bets as lost
        const { error } = await supabase
            .from('bets')
            .update({ status: 'lost', win_amount: 0 })
            .in('id', betIds)
            .eq('status', 'placed');

        if (error) {
            console.error('Error marking bets as lost:', error);
            return NextResponse.json({ error: 'Failed to update bets' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
