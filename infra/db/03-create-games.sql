-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id BIGSERIAL PRIMARY KEY,
    player_one_id BIGINT NOT NULL,
    player_two_id BIGINT,
    status VARCHAR(50) NOT NULL,
    current_turn_player_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_games_player_one_id ON games(player_one_id);
CREATE INDEX idx_games_player_two_id ON games(player_two_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_current_turn_player_id ON games(current_turn_player_id);
CREATE INDEX idx_games_created_at ON games(created_at);

-- Add foreign key constraints (assuming users table exists)
-- Uncomment these lines when the users table is available
-- ALTER TABLE games ADD CONSTRAINT fk_games_player_one FOREIGN KEY (player_one_id) REFERENCES users(id);
-- ALTER TABLE games ADD CONSTRAINT fk_games_player_two FOREIGN KEY (player_two_id) REFERENCES users(id);
-- ALTER TABLE games ADD CONSTRAINT fk_games_current_turn FOREIGN KEY (current_turn_player_id) REFERENCES users(id);

-- Add check constraint to ensure player_one_id and player_two_id are different
ALTER TABLE games ADD CONSTRAINT check_players_different 
    CHECK (player_one_id != player_two_id OR player_two_id IS NULL);

-- Add check constraint to ensure current_turn_player_id is either player_one_id or player_two_id
ALTER TABLE games ADD CONSTRAINT check_current_turn_valid 
    CHECK (current_turn_player_id IS NULL OR 
           current_turn_player_id = player_one_id OR 
           current_turn_player_id = player_two_id);

-- 1. Add the missing columns
ALTER TABLE games ADD COLUMN IF NOT EXISTS invited_player_id BIGINT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS word VARCHAR(10);
ALTER TABLE games ADD COLUMN IF NOT EXISTS word_length INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS max_attempts INTEGER;
ALTER TABLE games ADD COLUMN IF NOT EXISTS winner_id BIGINT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
ALTER TABLE games ADD COLUMN started_at DATETIME;

-- 2. Update existing status index (Optional, but good for performance)
CREATE INDEX IF NOT EXISTS idx_games_invited_player_id ON games(invited_player_id);