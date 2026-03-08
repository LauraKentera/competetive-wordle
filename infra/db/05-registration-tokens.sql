-- Secure registration nonce: required for sign-up to prevent abuse.
-- Token is issued with client IP and User-Agent and validated on register.
CREATE TABLE IF NOT EXISTS registration_tokens (
    token_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_registration_tokens_token ON registration_tokens(token);
CREATE INDEX idx_registration_tokens_expires_at ON registration_tokens(expires_at);
