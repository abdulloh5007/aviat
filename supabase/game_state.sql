-- Создать таблицу для состояния игры
CREATE TABLE IF NOT EXISTS game_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    round_id INTEGER NOT NULL DEFAULT 1,
    phase VARCHAR(20) NOT NULL DEFAULT 'waiting',
    multiplier DECIMAL(10,2) DEFAULT 1.00,
    crash_point DECIMAL(10,2),
    phase_start_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Вставить начальное состояние
INSERT INTO game_state (round_id, phase, multiplier) 
VALUES (1, 'waiting', 1.00)
ON CONFLICT DO NOTHING;

-- Включить Row Level Security
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;

-- Политика: все могут читать
CREATE POLICY "Anyone can read game_state" ON game_state
    FOR SELECT USING (true);

-- Включить Realtime для таблицы
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;

-- Индекс для быстрого доступа
CREATE INDEX IF NOT EXISTS idx_game_state_round ON game_state(round_id);
