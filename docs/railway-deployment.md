# Railway Deployment (GitHub Auto-Deploy)

This repository is a monorepo. The easiest production setup on Railway is:

- one `backend` service (Dockerfile deploy)
- one `frontend` service (static build from CRA)
- one MySQL plugin
- one Redis plugin

## 1) Connect GitHub

1. Push your branch to GitHub.
2. In Railway, create a new project from that GitHub repo.
3. Keep auto-deploy enabled for the branch you want to ship.

## 2) Create plugins

Add both plugins inside the same Railway project:

- MySQL
- Redis

## 3) Configure backend service

Create a service from this repository with root directory `backend` and deploy from `backend/Dockerfile`.

Set these environment variables:

- `SPRING_PROFILES_ACTIVE=prod`
- `APP_JWT_SECRET=<long-random-secret>`
- `APP_CORS_ALLOWED_ORIGINS=https://<frontend-domain>`
- `SPRING_DATASOURCE_URL=<Railway MySQL JDBC URL>`
- `SPRING_DATASOURCE_USERNAME=<Railway MySQL user>`
- `SPRING_DATASOURCE_PASSWORD=<Railway MySQL password>`
- `SPRING_DATA_REDIS_HOST=<Railway Redis host>`
- `SPRING_DATA_REDIS_PORT=<Railway Redis port>`
- `REDIS_PASSWORD=<Railway Redis password if required>`

The backend already serves health at `/api/health`.

## 4) Initialize schema in Railway MySQL

Apply SQL files from `infra/db` in filename order:

1. `01-schema.sql`
2. `03-create-games.sql`
3. `04-add-game-word-columns.sql`
4. `05-registration-tokens.sql`
5. `06-user-status-last-login.sql`
6. `07-game-ended-at.sql`
7. `08-game-invited-player.sql`
8. `09-chat-rooms-and-messages.sql`

Use your preferred MySQL client connected to the Railway MySQL plugin.

## 5) Configure frontend service

Create a second Railway service from this same repo with root directory `frontend`.

- Build command: `npm ci && npm run build`
- Output directory: `build`
- Environment variable: `REACT_APP_API_BASE_URL=https://<backend-domain>`

After backend deploys and you have its public URL, set `REACT_APP_API_BASE_URL` and redeploy frontend.

## 6) Verify

- Backend: `GET https://<backend-domain>/api/health` returns `{"status":"ok"}`
- Frontend can log in/register and open WebSocket features (lobby/game chat).
