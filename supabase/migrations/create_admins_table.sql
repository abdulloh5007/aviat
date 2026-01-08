-- Создать таблицу для админов
-- user_id - это 6-значный ID из таблицы profiles
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id VARCHAR(6) NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
    added_by BIGINT NOT NULL,  -- Telegram ID того кто добавил
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включить Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Anyone can read admins" ON admins
    FOR SELECT USING (true);

-- Политика: только service_role может изменять (для бота)
CREATE POLICY "Service role can manage admins" ON admins
    FOR ALL USING (true);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);
