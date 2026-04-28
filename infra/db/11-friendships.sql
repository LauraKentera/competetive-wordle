CREATE TABLE friendships (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    requester_id BIGINT NOT NULL,
    addressee_id BIGINT NOT NULL,
    status ENUM('PENDING','ACCEPTED','REJECTED','BLOCKED') NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_friendship (requester_id, addressee_id),
    CONSTRAINT fk_friendship_requester FOREIGN KEY (requester_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_friendship_addressee FOREIGN KEY (addressee_id)
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_no_self_friend CHECK (requester_id <> addressee_id)
);

CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);