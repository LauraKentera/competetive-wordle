# ER Diagram (Mermaid)

```mermaid
erDiagram
    USERS {
        BIGINT id PK
        VARCHAR username UK
        VARCHAR password_hash
        VARCHAR role
        TIMESTAMP created_at
        TIMESTAMP last_login
        VARCHAR status
        TINYINT avatar_id
        INT games_played
        INT games_won
        INT games_lost
        INT games_drawn
        INT games_forfeited
    }

    GAMES {
        BIGINT id PK
        BIGINT player_one_id
        BIGINT player_two_id
        BIGINT current_turn_player_id
        VARCHAR status
        TIMESTAMP created_at
        TIMESTAMP ended_at
        VARCHAR word
        INT word_length
        INT max_attempts
        BIGINT winner_id
        BIGINT invited_player_id
    }

    GUESSES {
        BIGINT id PK
        BIGINT game_id FK
        BIGINT player_id
        VARCHAR guess_word
        VARCHAR result
        INT attempt_number
        TIMESTAMP created_at
    }

    REGISTRATION_TOKENS {
        BIGINT token_id PK
        VARCHAR token UK
        VARCHAR ip_address
        VARCHAR user_agent
        TIMESTAMP created_at
        TIMESTAMP expires_at
        BOOLEAN used
    }

    CHAT_ROOMS {
        BIGINT chat_room_id PK
        ENUM type
        BIGINT game_id
        BIGINT created_by FK
        TIMESTAMP created_at
    }

    CHAT_MESSAGES {
        BIGINT message_id PK
        BIGINT chat_room_id FK
        BIGINT user_id FK
        TEXT message
        TIMESTAMP sent_at
    }

    FRIENDSHIPS {
        BIGINT id PK
        BIGINT requester_id FK
        BIGINT addressee_id FK
        ENUM status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    CHAT_ROOM_MEMBERS {
        BIGINT room_id PK,FK
        BIGINT user_id PK,FK
    }

    %% Explicit foreign keys
    GAMES ||--o{ GUESSES : "id = game_id (FK)"
    CHAT_ROOMS ||--o{ CHAT_MESSAGES : "chat_room_id = chat_room_id (FK)"
    USERS ||--o{ CHAT_MESSAGES : "id = user_id (FK)"
    USERS ||--o{ CHAT_ROOMS : "id = created_by (FK)"
    USERS ||--o{ FRIENDSHIPS : "id = requester_id (FK)"
    USERS ||--o{ FRIENDSHIPS : "id = addressee_id (FK)"
    CHAT_ROOMS ||--o{ CHAT_ROOM_MEMBERS : "chat_room_id = room_id (FK)"
    USERS ||--o{ CHAT_ROOM_MEMBERS : "id = user_id (FK)"

    %% Logical relationships (columns exist but FK not declared in SQL)
    USERS ||--o{ GAMES : "id = player_one_id (logical)"
    USERS ||--o{ GAMES : "id = player_two_id (logical)"
    USERS ||--o{ GAMES : "id = current_turn_player_id (logical)"
    USERS ||--o{ GAMES : "id = winner_id (logical)"
    USERS ||--o{ GAMES : "id = invited_player_id (logical)"
    GAMES ||--o{ CHAT_ROOMS : "id = game_id (logical)"
    USERS ||--o{ GUESSES : "id = player_id (logical)"
```

Notes:
- `registration_tokens` is standalone (no FK relationships).
- Some relationships are marked `logical` because the column exists but no explicit FK constraint is present in the migrations.
