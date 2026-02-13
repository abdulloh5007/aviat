import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkAdminByAuthId } from '@/lib/adminCheck';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PROFILE_CHUNK_SIZE = 100;

const chunkArray = <T>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { adminUserId } = body;

        // Verify admin (check both GAME_ADMIN_ID and admins table)
        const isAdmin = await checkAdminByAuthId(adminUserId);
        if (!adminUserId || !isAdmin) {
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

        // Get profiles for user_id lookup (profiles.id = withdraw_requests.user_id).
        // Fetch in chunks to avoid very long query strings when there are many requests.
        const userIds = [...new Set((withdrawals?.map(w => w.user_id) || []).filter(Boolean))];
        const profilesMap = new Map<string, { user_id: string; phone: string }>();

        for (const idsChunk of chunkArray(userIds, PROFILE_CHUNK_SIZE)) {
            const { data: profilesChunk, error: profilesError } = await supabase
                .from('profiles')
                .select('id, user_id, phone')
                .in('id', idsChunk);

            if (profilesError) {
                console.error('Error fetching profile chunk for withdrawals:', profilesError);
                continue;
            }

            for (const profile of profilesChunk || []) {
                profilesMap.set(profile.id, {
                    user_id: profile.user_id || '',
                    phone: profile.phone || ''
                });
            }
        }

        // Map: profiles.user_id (VARCHAR 6-digit) for display
        const withdrawalsWithUsers = withdrawals?.map(withdrawal => {
            const profile = profilesMap.get(withdrawal.user_id);
            return {
                ...withdrawal,
                profile_user_id: profile?.user_id || withdrawal.user_id || 'Unknown'
            };
        });

        return NextResponse.json({ withdrawals: withdrawalsWithUsers || [] });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
