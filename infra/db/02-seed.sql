USE wordle;

-- placeholder seed (replace later)
INSERT INTO users (username, password_hash, role)
VALUES ('admin', 'CHANGE_ME', 'ADMIN')
    ON DUPLICATE KEY UPDATE username=username;