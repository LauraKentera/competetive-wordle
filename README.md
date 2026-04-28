# Competitive Wordle

Real-time multiplayer Wordle clone built with Spring Boot, React (Create React App), WebSockets, and JWT-based authentication.

## Tech Stack

Backend
Spring Boot
Spring Security
Spring Data JPA
WebSocket (STOMP)
MySQL

## Frontend
React (Create React App, TypeScript)
React Router v6
STOMP WebSocket client

## Infrastructure
Docker (MySQL containerized for local development)

## Production Deployment (Railway + GitHub)

The recommended and simplest deployment path is documented here:

- `docs/railway-deployment.md`

Use two Railway services from this monorepo:

- `backend` (Dockerfile service)
- `frontend` (static CRA build service)

with Railway MySQL and Redis plugins.

## Project Structure

backend/
  src/
    auth/
    user/
    lobby/
    game/
    chat/
    common/

frontend/
  src/
    config/
    types/
    api/
    ws/
    auth/
    components/
    features/
    hooks/
    routes/
    styles/

infra/
    docker-compose.yml
    db/

## Local Development Setup

### Start the Database

Docker is required.

From the infra directory run:

cd infra
docker compose up -d

The MySQL database runs on:

Host: 127.0.0.1
Port: 3307
Database: wordle
Username: root
Password: root

To completely reset the database:

docker compose down -v
docker compose up -d

### Start the Backend

From the backend directory run:

cd backend
mvn spring-boot:run

The backend runs on:

[http://localhost:8080](http://localhost:8080)

## Health Check

To verify that the backend is running:

curl [http://localhost:8080/api/health](http://localhost:8080/api/health)

Expected response:

{"status":"ok"}

### Start the Frontend
cd frontend
npm install
cp .env.example .env
npm start

The frontend runs on:
[http://localhost:3000]

#### Environment variables

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_BASE_URL` | `http://localhost:8080` | Backend base URL |

## Frontend Routes

| Path | Protected | Description |
|---|---|---|
| `/login` | No | Login page |
| `/register` | No | Register page |
| `/lobby` | Yes | Online players, challenges, chat |
| `/games/:gameId` | Yes | Active game board and chat |

## Security

Spring Security is enabled.

Currently, the endpoint /api/health is publicly accessible.

All other endpoints are protected and will require authentication once JWT is implemented.

## Branching and Contribution Rules

Direct pushes to main are disabled.

All changes must go through Pull Requests.

At least one approval is required before merging into main.

## Current Status

### Backend

* Runnable base configuration completed
* Dockerized MySQL configured
* Health endpoint implemented
* Global CORS configuration implemented
* Global exception handler implemented
* Initial security configuration in place

### Frontend

* CRA TypeScript scaffold in place
* Folder structure established
* React Router v6 configured
* Shared UI components built (AppLayout, NavBar, Button, Input, Spinner, ErrorBanner)
* Environment config set up

### Next Steps

* Implement TypeScript DTO types mirroring backend
* Implement httpClient with Bearer JWT
* Implement AuthContext, tokenStorage, LoginPage, RegisterPage
* Implement WebSocket infrastructure (stompClient, useLobbyWebSocket)
* Implement LobbyPage, GamePage, GameChatPanel