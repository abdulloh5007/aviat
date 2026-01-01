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
        const { adminUserId } = body;

        // Verify admin
        if (!adminUserId || adminUserId !== GAME_ADMIN_ID) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all withdrawal requests
        const { data: withdrawals, error } = await supabase
            .from('withdraw_requests')
            .select(`
                id,
                user_id,
                method,
                amount,
                card_number,
                card_expiry,
                status,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching withdrawals:', error);
            return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
        }

        // Get profiles for user_id lookup (profiles.user_id is the short 6-digit ID)
        const userIds = [...new Set(withdrawals?.map(w => w.user_id) || [])];

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, user_id, phone')
            .in('id', userIds);

        // Map: profiles.user_id (VARCHAR 6-digit) for display
        const withdrawalsWithUsers = withdrawals?.map(withdrawal => {
            const profile = profiles?.find(p => p.id === withdrawal.user_id);
            return {
                ...withdrawal,
                profile_user_id: profile?.user_id || 'Unknown'
            };
        });

        return NextResponse.json({ withdrawals: withdrawalsWithUsers || [] });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
