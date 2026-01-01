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

        // Get all user profiles
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, user_id, phone, balance, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ users: users || [] });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
