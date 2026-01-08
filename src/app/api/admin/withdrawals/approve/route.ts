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
        const { adminUserId, withdrawalId } = body;

        // Verify admin (check both GAME_ADMIN_ID and admins table)
        const isAdmin = await checkAdminByAuthId(adminUserId);
        if (!adminUserId || !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!withdrawalId) {
            return NextResponse.json({ error: 'Withdrawal ID required' }, { status: 400 });
        }

        // Get withdrawal details
        const { data: withdrawal, error: withdrawalError } = await supabase
            .from('withdraw_requests')
            .select('*')
            .eq('id', withdrawalId)
            .single();

        if (withdrawalError || !withdrawal) {
            return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
        }

        // Update status to completed
        const { error: updateError } = await supabase
            .from('withdraw_requests')
            .update({ status: 'completed' })
            .eq('id', withdrawalId);

        if (updateError) {
            console.error('Error updating withdrawal:', updateError);
            return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Withdrawal approved'
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
