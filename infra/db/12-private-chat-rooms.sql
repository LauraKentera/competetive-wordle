-- Extend the existing chat_rooms table to support DM rooms
ALTER TABLE chat_rooms
MODIFY COLUMN type ENUM('GAME','LOBBY','DIRECT') NOT NULL DEFAULT 'GAME',
ADD COLUMN created_by BIGINT NULL,
ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT fk_chatroom_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Junction table: which users belong to a direct-message room
CREATE TABLE chat_room_members (
    room_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    PRIMARY KEY (room_id, user_id),
    CONSTRAINT fk_member_room FOREIGN KEY (room_id)
        REFERENCES chat_rooms(chat_room_id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_room_members_user ON chat_room_members(user_id);