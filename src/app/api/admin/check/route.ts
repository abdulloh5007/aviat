import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GAME_ADMIN_ID = process.env.GAME_ADMIN_ID;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ isAdmin: false });
        }

        if (!GAME_ADMIN_ID) {
            return NextResponse.json({ isAdmin: false });
        }

        // Check if user ID matches admin ID
        const isAdmin = userId === GAME_ADMIN_ID;

        return NextResponse.json({ isAdmin });
    } catch (error) {
        return NextResponse.json({ isAdmin: false });
    }
}
