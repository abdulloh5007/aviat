import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminByAuthId } from '@/lib/adminCheck';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminUserId, paymentId } = body;

        // Verify admin (check both GAME_ADMIN_ID and admins table)
        const isAdmin = await checkAdminByAuthId(adminUserId);
        if (!adminUserId || !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!paymentId) {
            return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
        }

        // Update payment status to cancelled
        const { error: updateError } = await supabase
            .from('payment_requests')
            .update({ status: 'cancelled' })
            .eq('id', paymentId);

        if (updateError) {
            console.error('Error updating payment:', updateError);
            return NextResponse.json({ error: 'Failed to reject payment' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Payment rejected'
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
