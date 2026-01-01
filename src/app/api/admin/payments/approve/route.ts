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
        const { adminUserId, paymentId, amount } = body;

        // Verify admin
        if (!adminUserId || adminUserId !== GAME_ADMIN_ID) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
        }

        // Get payment details
        const { data: payment, error: paymentError } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('id', paymentId)
            .single();

        if (paymentError || !payment) {
            return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Update payment status to completed
        const { error: updateError } = await supabase
            .from('payment_requests')
            .update({ status: 'completed' })
            .eq('id', paymentId);

        if (updateError) {
            console.error('Error updating payment:', updateError);
            return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
        }

        // Add balance to user's profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', payment.user_id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
        }

        const newBalance = (profile?.balance || 0) + payment.amount;

        const { error: balanceError } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', payment.user_id);

        if (balanceError) {
            console.error('Error updating balance:', balanceError);
            return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment approved',
            newBalance
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
