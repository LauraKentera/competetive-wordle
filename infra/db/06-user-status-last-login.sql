-- User status for lobby visibility (ONLINE, OFFLINE, IN_GAME) and last login timestamp.
-- Run once; if columns already exist (e.g. from Hibernate ddl-auto), skip or ignore duplicate-column errors.
ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL;
ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'OFFLINE';
