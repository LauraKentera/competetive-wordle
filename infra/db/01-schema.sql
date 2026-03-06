USE wordle;

CREATE TABLE IF NOT EXISTS users (
                                     id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS games (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    player_one_id BIGINT NOT NULL,
    player_two_id BIGINT,
    status VARCHAR(50) NOT NULL,
    current_turn_player_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (player_one_id) REFERENCES users(id),
    FOREIGN KEY (player_two_id) REFERENCES users(id),
    FOREIGN KEY (current_turn_player_id) REFERENCES users(id)
);

CREATE INDEX idx_games_player_one_id ON games(player_one_id);
CREATE INDEX idx_games_player_two_id ON games(player_two_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_current_turn_player_id ON games(current_turn_player_id);
CREATE INDEX idx_games_created_at ON games(created_at);

ALTER TABLE games 
    ADD CONSTRAINT check_players_different 
    CHECK (player_one_id != player_two_id OR player_two_id IS NULL);

ALTER TABLE games 
    ADD CONSTRAINT check_current_turn_valid 
    CHECK (current_turn_player_id IS NULL OR 
           current_turn_player_id = player_one_id OR 
           current_turn_player_id = player_two_id);