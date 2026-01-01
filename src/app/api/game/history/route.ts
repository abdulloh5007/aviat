import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const { multiplier, adminKey } = await request.json();

        // Проверка ключа
        if (adminKey !== process.env.GAME_ADMIN_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!multiplier || typeof multiplier !== 'number') {
            return NextResponse.json({ error: 'Invalid multiplier' }, { status: 400 });
        }

        // Сохранить в историю
        const { error } = await supabase
            .from('game_rounds')
            .insert({ multiplier: multiplier });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
