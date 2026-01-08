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
        const { adminUserId } = body;

        // Verify admin (check both GAME_ADMIN_ID and admins table)
        const isAdmin = await checkAdminByAuthId(adminUserId);
        if (!adminUserId || !isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all payment requests
        const { data: payments, error } = await supabase
            .from('payment_requests')
            .select(`
                id,
                user_id,
                method,
                amount,
                card_number,
                status,
                created_at,
                expires_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching payments:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        // Get profiles for user_id lookup (profiles.id = payment_requests.user_id)
        const userIds = [...new Set(payments?.map(p => p.user_id) || [])];

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, user_id, phone')
            .in('id', userIds);

        // Map: profiles.user_id (VARCHAR 6-digit) for display
        const paymentsWithUsers = payments?.map(payment => {
            const profile = profiles?.find(p => p.id === payment.user_id);
            return {
                ...payment,
                profile_user_id: profile?.user_id || 'Unknown',
                user_phone: profile?.phone || ''
            };
        });

        return NextResponse.json({ payments: paymentsWithUsers || [] });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
