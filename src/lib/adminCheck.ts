import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Check if user is an admin (only checks admins table by user_id)
 * Admins are added by the owner via Telegram bot
 * @param authId - Supabase auth UUID (to lookup user_id from profiles)
 */
export async function checkAdminByAuthId(authId: string): Promise<boolean> {
    if (!authId || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return false;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Get user_id from profiles by auth id
    const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', authId)
        .single();

    if (!profile?.user_id) {
        return false;
    }

    // Check if user_id exists in admins table
    const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', profile.user_id)
        .single();

    return !!admin;
}

/**
 * Check if user is an admin by user_id (6-digit)
 * @param userId - 6-digit game user ID
 */
export async function checkAdminByUserId(userId: string): Promise<boolean> {
    if (!userId || userId === '000000' || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return false;
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: admin } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', userId)
        .single();

    return !!admin;
}
