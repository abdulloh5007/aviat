-- Fix payment_requests.status length limitation
-- Root cause: status value 'awaiting_confirmation' is 21 chars,
-- while some databases had status as VARCHAR(20).

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'payment_requests'
          AND column_name = 'status'
    ) THEN
        -- Remove length limit to avoid runtime failures on status updates.
        ALTER TABLE public.payment_requests
            ALTER COLUMN status TYPE TEXT;

        -- Keep a safe default and clean null/empty rows.
        ALTER TABLE public.payment_requests
            ALTER COLUMN status SET DEFAULT 'pending';

        UPDATE public.payment_requests
        SET status = 'pending'
        WHERE status IS NULL OR BTRIM(status) = '';

        ALTER TABLE public.payment_requests
            ALTER COLUMN status SET NOT NULL;
    END IF;
END $$;

