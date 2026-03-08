-- Add word and game outcome columns to games (same word for both players in a session).
-- Run once; if columns already exist, ignore duplicate-column errors.
ALTER TABLE games ADD COLUMN word VARCHAR(10) NULL;
ALTER TABLE games ADD COLUMN word_length INT NULL;
ALTER TABLE games ADD COLUMN max_attempts INT NULL DEFAULT 6;
ALTER TABLE games ADD COLUMN winner_id BIGINT NULL;
