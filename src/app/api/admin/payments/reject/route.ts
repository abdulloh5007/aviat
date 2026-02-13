import { NextRequest, NextResponse } from 'next/server';
import { checkAdminByAuthId } from '@/lib/adminCheck';
import { rejectPaymentRequest } from '@/lib/paymentActions';

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

        const result = await rejectPaymentRequest(paymentId);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.statusCode });
        }

        return NextResponse.json({
            success: true,
            message: result.state === 'already_cancelled' ? 'Payment already rejected' : 'Payment rejected',
            alreadyProcessed: result.state === 'already_cancelled'
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
