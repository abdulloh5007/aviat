import { NextRequest, NextResponse } from 'next/server';
import { checkAdminByAuthId, checkAdminByUserId } from '@/lib/adminCheck';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, authId } = body;

        // Check if user is admin (only from admins table)
        let isAdmin = false;

        // First try by authId (UUID)
        if (authId) {
            isAdmin = await checkAdminByAuthId(authId);
        }

        // Also try by userId (6-digit) if not found
        if (!isAdmin && userId && userId !== '000000') {
            isAdmin = await checkAdminByUserId(userId);
        }

        return NextResponse.json({ isAdmin });
    } catch (error) {
        console.error('Admin check error:', error);
        return NextResponse.json({ isAdmin: false });
    }
}
