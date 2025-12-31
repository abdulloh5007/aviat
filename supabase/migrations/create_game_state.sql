-- Game State Table for Supabase Realtime
-- Run this SQL in your Supabase SQL Editor

-- Drop existing table if exists (to fix type issues)
DROP TABLE IF EXISTS game_state;

-- Create game_state table with correct types
CREATE TABLE game_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id INTEGER NOT NULL DEFAULT 1,
    game_state TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'flying', 'crashed'
    current_multiplier DECIMAL(10,2) DEFAULT 1.00,
    target_multiplier DECIMAL(10,2) DEFAULT 2.00,
    countdown_seconds DECIMAL(10,1) DEFAULT 5.0,  -- DECIMAL for fractional countdown
    crashed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial game state (only one row needed)
INSERT INTO game_state (round_id, game_state, current_multiplier, target_multiplier, countdown_seconds)
VALUES (1, 'waiting', 1.00, 2.00, 5.0);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_game_state_updated_at ON game_state;
CREATE TRIGGER update_game_state_updated_at
    BEFORE UPDATE ON game_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
