-- Telegram chat IDs configurable from admin panel
CREATE TABLE IF NOT EXISTS telegram_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    payments_chat_id TEXT NOT NULL DEFAULT '',
    analysis_chat_id TEXT NOT NULL DEFAULT '',
    updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Ensure singleton row exists
INSERT INTO telegram_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Keep RLS on; server routes use service role key
ALTER TABLE telegram_settings ENABLE ROW LEVEL SECURITY;
