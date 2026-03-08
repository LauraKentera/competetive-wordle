-- Game end timestamp (when status becomes COMPLETED).
ALTER TABLE games ADD COLUMN ended_at TIMESTAMP NULL;
