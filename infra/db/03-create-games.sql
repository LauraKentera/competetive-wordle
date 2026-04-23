-- Create games table
CREATE TABLE IF NOT EXISTS games (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    player_one_id BIGINT NOT NULL,
    player_two_id BIGINT NULL,
    status VARCHAR(50) NOT NULL,
    current_turn_player_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_games_player_one_id ON games(player_one_id);
CREATE INDEX idx_games_player_two_id ON games(player_two_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_current_turn_player_id ON games(current_turn_player_id);
CREATE INDEX idx_games_created_at ON games(created_at);

-- Add check constraint to ensure player_one_id and player_two_id are different
ALTER TABLE games
ADD CONSTRAINT check_players_different
CHECK (player_one_id != player_two_id OR player_two_id IS NULL);

-- Add check constraint to ensure current_turn_player_id is either player_one_id or player_two_id
ALTER TABLE games
ADD CONSTRAINT check_current_turn_valid
CHECK (
    current_turn_player_id IS NULL OR
    current_turn_player_id = player_one_id OR
    current_turn_player_id = player_two_id
);

-- Add the foreign key from guesses to games now that games exists
ALTER TABLE guesses
ADD CONSTRAINT fk_guesses_game
FOREIGN KEY (game_id) REFERENCES games(id);