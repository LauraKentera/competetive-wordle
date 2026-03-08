-- Directed challenge: only the invited user can accept the game.
ALTER TABLE games ADD COLUMN invited_player_id BIGINT NULL;
