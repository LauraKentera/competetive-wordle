# Competitive Wordle – Backend

Spring Boot backend for the Competitive Wordle game: REST API, WebSockets (STOMP), JWT auth, MySQL persistence, and Redis-backed lobby and game chat.

---

## How to Run the Backend

### 1. Start infrastructure (MySQL and Redis)

From the project root:

```bash
cd infra
docker compose up -d
cd ..
```

This starts:

- **MySQL** on port **3307** (mapped from 3306) with database `wordle`. SQL scripts in `infra/db/` run on first start.
- **Redis** on port **6379** for lobby and game chat caching.

See `infra/docker-compose.yml` for the full setup.
This compose file is for local development infrastructure only.

For production deployment with Railway + GitHub, see `docs/railway-deployment.md` at the repository root.

### 2. Build the backend

```bash
cd backend
mvn clean compile
```

### 3. Run the backend

```bash
mvn spring-boot:run
```

By default the `dev` profile is active: it connects to MySQL at `127.0.0.1:3307` and Redis at `localhost:6379`. The API is available at **http://localhost:8080**.

To run with a different profile (e.g. production):

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

---

## Architecture Overview

The backend is a **layered, feature-sliced** Spring Boot application:

- **Presentation:** REST controllers and STOMP WebSocket handlers.
- **Application:** Services that implement auth, lobby, game, and chat logic.
- **Persistence:** JPA entities, repositories (MySQL), and Redis for recent lobby and game chat.

Security is **stateless JWT** (OAuth2 resource server). WebSocket connections are authenticated by sending the JWT in the STOMP CONNECT frame.

---

## Package Structure (`edu.rit.backend`)

| Package | Responsibility |
|--------|-----------------|
| **auth** | Registration (with nonce), login, JWT generation/validation, registration tokens. |
| **user** | User entity (including `lastLogin`, `status`), `UserRepository`, `UserService`, `UserController` (`/api/users`, `/api/me`). |
| **game** | Game and Guess entities, turn-based Wordle logic, `WordApiClient`, `GameService`, `GameController` (`/api/games`), Wordle feedback (G/Y/X). |
| **lobby** | Online players list, challenges (create/accept), lobby chat (persisted in DB, cached in Redis) over WebSocket; connect/disconnect updates user status and broadcasts player list. |
| **chat** | `ChatRoom` / `ChatMessage` entities, persistence, Redis cache for recent messages; lobby and game chat WebSocket and REST history. |
| **common** | Security config, CORS, WebSocket config and JWT STOMP interceptor, global exception handling, health endpoint. |

---

## REST API (main endpoints)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (no auth). |
| GET | `/api/auth/registration-token` | Obtain a one-time token for registration (no auth). |
| POST | `/api/auth/register` | Register with `username`, `password`, `registrationToken` (no auth). |
| POST | `/api/auth/login` | Login; returns JWT (no auth). |
| GET | `/api/me` | Current user (auth). |
| GET | `/api/users/{id}` | User by id (auth). |
| GET | `/api/lobby/players` | Online players (auth). |
| GET | `/api/lobby/chat` | Recent lobby chat messages (auth). Query: `limit` (default 50). |
| GET | `/api/lobby/challenges` | Pending challenges for current user (auth). |
| POST | `/api/lobby/challenge/{userId}` | Create a challenge (auth). |
| POST | `/api/games` | Create a game (auth). |
| POST | `/api/games/{id}/accept` | Accept a game (auth). |
| GET | `/api/games/{id}` | Game state (auth). |
| POST | `/api/games/{id}/guess` | Submit a guess; body `{ "word": "..." }` (auth). |
| GET | `/api/games/{id}/chat` | Recent game chat messages (auth; players only). |

---

## WebSockets (STOMP over SockJS)

- **Endpoint:** `http://localhost:8080/ws` (SockJS). Then connect with STOMP; send **JWT in CONNECT header:** `Authorization: Bearer <accessToken>`.

**Subscriptions:**

| Destination | Purpose |
|-------------|---------|
| `/topic/lobby/players` | Broadcast of online player list (updated on connect/disconnect). |
| `/topic/lobby/chat` | Lobby chat messages. |
| `/user/queue/challenges` | Incoming challenge notifications (user destination). |
| `/topic/game/{gameId}/chat` | Game chat messages for that game. |

**Send destinations:**

| Destination | Body | Purpose |
|-------------|------|---------|
| `/app/lobby/chat.send` | `{ "content": "...", "timestamp": "..." }` | Send lobby message (sender set from JWT). |
| `/app/game/{gameId}/chat.send` | `{ "content": "..." }` | Send game chat (only players). |

---

## Data and Caching

- **MySQL:** Users, registration tokens, games, guesses, chat rooms, chat messages (lobby and game). Schema can be created/updated via Hibernate (`ddl-auto=update` in dev) or via scripts in `infra/db/`.
- **Redis:** Recent chat per room (key `chat:room:{roomId}`; last 50 messages). Used for both **lobby** and **game** chat to speed up “recent messages” and history. If Redis is down, the app falls back to DB only.

---

## Configuration

- **Profiles:** `dev` (default) uses `application-dev.properties` (local MySQL, local Redis). Override with env or `application-<profile>.properties` for other environments.
- **JWT:** `app.jwt.secret`, `app.jwt.issuer`, `app.jwt.expiration-seconds` in `application*.properties`.
- **MySQL:** In `dev`, `spring.datasource.url` points to `jdbc:mysql://127.0.0.1:3307/wordle`. For other profiles, use `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`.
- **Redis:** `spring.data.redis.host` and `spring.data.redis.port` (defaults: localhost, 6379). Override with `SPRING_DATA_REDIS_HOST` and `SPRING_DATA_REDIS_PORT` if needed.

---

## Run Summary

1. **Infra:** `cd infra && docker compose up -d` (starts MySQL and Redis)
2. **Build:** `cd backend && mvn clean compile`
3. **Run:** `mvn spring-boot:run`

**Tests:** Run `mvn verify` (or `mvn test`) from `backend/`. Tests use H2 and require Redis at `localhost:6379`—start infra first so Redis is available. CI (`.github/workflows/backend-ci.yml`) runs tests with a Redis service container.
