-- Chat rooms: one per game (GAME) and one for lobby (LOBBY).
CREATE TABLE IF NOT EXISTS chat_rooms (
    chat_room_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(20) NOT NULL,
    game_id BIGINT NULL
);

-- Chat messages: persisted and cached in Redis for recent history.
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    chat_room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_room FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(chat_room_id),
    CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_chat_messages_room_sent ON chat_messages(chat_room_id, sent_at);
