-- Align game_state schema with app runtime expectations
-- Expected columns: phase, multiplier, crash_point, phase_start_at

ALTER TABLE IF EXISTS public.game_state
    ADD COLUMN IF NOT EXISTS phase VARCHAR(20),
    ADD COLUMN IF NOT EXISTS multiplier DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS crash_point DECIMAL(10, 2),
    ADD COLUMN IF NOT EXISTS phase_start_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    -- phase <- game_state (legacy)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'game_state'
          AND column_name = 'game_state'
    ) THEN
        EXECUTE $sql$
            UPDATE public.game_state
            SET phase = COALESCE(phase, game_state, 'waiting')
            WHERE phase IS NULL
        $sql$;
    ELSE
        EXECUTE $sql$
            UPDATE public.game_state
            SET phase = COALESCE(phase, 'waiting')
            WHERE phase IS NULL
        $sql$;
    END IF;

    -- multiplier <- current_multiplier (legacy)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'game_state'
          AND column_name = 'current_multiplier'
    ) THEN
        EXECUTE $sql$
            UPDATE public.game_state
            SET multiplier = COALESCE(multiplier, current_multiplier, 1.00)
            WHERE multiplier IS NULL
        $sql$;
    ELSE
        EXECUTE $sql$
            UPDATE public.game_state
            SET multiplier = COALESCE(multiplier, 1.00)
            WHERE multiplier IS NULL
        $sql$;
    END IF;

    -- crash_point <- target_multiplier (legacy)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'game_state'
          AND column_name = 'target_multiplier'
    ) THEN
        EXECUTE $sql$
            UPDATE public.game_state
            SET crash_point = COALESCE(crash_point, target_multiplier)
            WHERE crash_point IS NULL
        $sql$;
    END IF;

    -- phase_start_at <- crashed_at/updated_at/created_at/now (legacy fallback)
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'game_state'
          AND column_name = 'crashed_at'
    ) THEN
        EXECUTE $sql$
            UPDATE public.game_state
            SET phase_start_at = COALESCE(phase_start_at, crashed_at, updated_at, created_at, NOW())
            WHERE phase_start_at IS NULL
        $sql$;
    ELSE
        EXECUTE $sql$
            UPDATE public.game_state
            SET phase_start_at = COALESCE(phase_start_at, updated_at, created_at, NOW())
            WHERE phase_start_at IS NULL
        $sql$;
    END IF;
END $$;

ALTER TABLE IF EXISTS public.game_state
    ALTER COLUMN phase SET DEFAULT 'waiting',
    ALTER COLUMN phase SET NOT NULL,
    ALTER COLUMN multiplier SET DEFAULT 1.00,
    ALTER COLUMN phase_start_at SET DEFAULT NOW();

-- Ensure at least one row exists
INSERT INTO public.game_state (round_id, phase, multiplier, crash_point, phase_start_at, updated_at)
SELECT 1, 'waiting', 1.00, 2.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.game_state);

-- Ensure realtime publication includes this table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'game_state'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.game_state;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
