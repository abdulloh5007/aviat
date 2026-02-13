import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PENDING_STATUSES = ['pending', 'awaiting_confirmation'];
const APPROVED_STATUSES = ['completed', 'approved'];
const REJECTED_STATUSES = ['cancelled', 'rejected', 'expired'];

export type ApprovePaymentResult = {
    ok: true;
    state: 'approved' | 'already_completed';
    paymentId: string;
    profileUserId: string;
    amount: number;
    newBalance: number;
} | {
    ok: false;
    error: string;
    statusCode: number;
};

export type RejectPaymentResult = {
    ok: true;
    state: 'rejected' | 'already_cancelled';
    paymentId: string;
    profileUserId: string;
    amount: number;
} | {
    ok: false;
    error: string;
    statusCode: number;
};

type PaymentRequestRow = {
    id: string;
    user_id: string;
    amount: number;
    status: string;
};

async function getPaymentRequest(paymentId: string): Promise<PaymentRequestRow | null> {
    const { data, error } = await supabase
        .from('payment_requests')
        .select('id, user_id, amount, status')
        .eq('id', paymentId)
        .single();

    if (error || !data) {
        return null;
    }

    return data as PaymentRequestRow;
}

async function getProfileByAuthId(authId: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('user_id, balance')
        .eq('id', authId)
        .single();

    if (error || !data) {
        return null;
    }

    return data as { user_id: string; balance: number | null };
}

export async function approvePaymentRequest(paymentId: string): Promise<ApprovePaymentResult> {
    if (!paymentId) {
        return { ok: false, error: 'Payment ID required', statusCode: 400 };
    }

    const existingPayment = await getPaymentRequest(paymentId);
    if (!existingPayment) {
        return { ok: false, error: 'Payment not found', statusCode: 404 };
    }

    const currentStatus = existingPayment.status;

    if (APPROVED_STATUSES.includes(currentStatus)) {
        const profile = await getProfileByAuthId(existingPayment.user_id);
        return {
            ok: true,
            state: 'already_completed',
            paymentId: existingPayment.id,
            profileUserId: profile?.user_id || existingPayment.user_id,
            amount: Number(existingPayment.amount || 0),
            newBalance: Number(profile?.balance || 0)
        };
    }

    if (REJECTED_STATUSES.includes(currentStatus)) {
        return { ok: false, error: `Payment already ${currentStatus}`, statusCode: 409 };
    }

    const { data: updatedRows, error: updateError } = await supabase
        .from('payment_requests')
        .update({ status: 'completed' })
        .eq('id', paymentId)
        .in('status', PENDING_STATUSES)
        .select('id, user_id, amount')
        .limit(1);

    if (updateError) {
        console.error('Error updating payment status:', updateError);
        return { ok: false, error: 'Failed to update payment', statusCode: 500 };
    }

    const updatedPayment = updatedRows?.[0] as { id: string; user_id: string; amount: number } | undefined;
    if (!updatedPayment) {
        const latestPayment = await getPaymentRequest(paymentId);
        if (latestPayment && APPROVED_STATUSES.includes(latestPayment.status)) {
            const profile = await getProfileByAuthId(latestPayment.user_id);
            return {
                ok: true,
                state: 'already_completed',
                paymentId: latestPayment.id,
                profileUserId: profile?.user_id || latestPayment.user_id,
                amount: Number(latestPayment.amount || 0),
                newBalance: Number(profile?.balance || 0)
            };
        }

        return { ok: false, error: 'Payment status changed by another process', statusCode: 409 };
    }

    const profile = await getProfileByAuthId(updatedPayment.user_id);
    if (!profile) {
        return { ok: false, error: 'Failed to fetch user profile', statusCode: 500 };
    }

    const newBalance = Number(profile.balance || 0) + Number(updatedPayment.amount || 0);

    const { error: balanceError } = await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', updatedPayment.user_id);

    if (balanceError) {
        console.error('Error updating balance:', balanceError);
        return { ok: false, error: 'Failed to update balance', statusCode: 500 };
    }

    return {
        ok: true,
        state: 'approved',
        paymentId: updatedPayment.id,
        profileUserId: profile.user_id || updatedPayment.user_id,
        amount: Number(updatedPayment.amount || 0),
        newBalance
    };
}

export async function rejectPaymentRequest(paymentId: string): Promise<RejectPaymentResult> {
    if (!paymentId) {
        return { ok: false, error: 'Payment ID required', statusCode: 400 };
    }

    const existingPayment = await getPaymentRequest(paymentId);
    if (!existingPayment) {
        return { ok: false, error: 'Payment not found', statusCode: 404 };
    }

    const currentStatus = existingPayment.status;

    if (REJECTED_STATUSES.includes(currentStatus)) {
        const profile = await getProfileByAuthId(existingPayment.user_id);
        return {
            ok: true,
            state: 'already_cancelled',
            paymentId: existingPayment.id,
            profileUserId: profile?.user_id || existingPayment.user_id,
            amount: Number(existingPayment.amount || 0)
        };
    }

    if (APPROVED_STATUSES.includes(currentStatus)) {
        return { ok: false, error: 'Cannot reject an approved payment', statusCode: 409 };
    }

    const { data: updatedRows, error: updateError } = await supabase
        .from('payment_requests')
        .update({ status: 'cancelled' })
        .eq('id', paymentId)
        .in('status', PENDING_STATUSES)
        .select('id, user_id, amount')
        .limit(1);

    if (updateError) {
        console.error('Error rejecting payment:', updateError);
        return { ok: false, error: 'Failed to reject payment', statusCode: 500 };
    }

    const updatedPayment = updatedRows?.[0] as { id: string; user_id: string; amount: number } | undefined;
    if (!updatedPayment) {
        const latestPayment = await getPaymentRequest(paymentId);
        if (latestPayment && REJECTED_STATUSES.includes(latestPayment.status)) {
            const profile = await getProfileByAuthId(latestPayment.user_id);
            return {
                ok: true,
                state: 'already_cancelled',
                paymentId: latestPayment.id,
                profileUserId: profile?.user_id || latestPayment.user_id,
                amount: Number(latestPayment.amount || 0)
            };
        }

        return { ok: false, error: 'Payment status changed by another process', statusCode: 409 };
    }

    const profile = await getProfileByAuthId(updatedPayment.user_id);

    return {
        ok: true,
        state: 'rejected',
        paymentId: updatedPayment.id,
        profileUserId: profile?.user_id || updatedPayment.user_id,
        amount: Number(updatedPayment.amount || 0)
    };
}
