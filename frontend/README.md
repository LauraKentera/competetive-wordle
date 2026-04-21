# Competitive Wordle — Frontend

React + TypeScript client for a multiplayer Wordle-style game. It talks to a **Spring Boot** backend over **REST** (JSON) and **STOMP over SockJS** (real-time lobby, game updates, and chat). See the backend under `../backend` (package `edu.rit.backend`) for API behavior, security, and WebSocket broker configuration.

## Stack

- **React 19** with **Create React App** (`react-scripts`)
- **TypeScript**
- **React Router** (`react-router-dom`) for client-side routing
- **Fetch** via a small `request()` wrapper (`src/api/httpClient.ts`) with JWT `Authorization` headers
- **STOMP** + **SockJS** for WebSockets (`src/ws/stompClient.ts`), matching the backend endpoint `/ws` — the implementation imports `@stomp/stompjs` and `sockjs-client`; they must be installed dependencies for the app to build (add them with npm if your `package.json` does not list them yet)

## Prerequisites

- **Node.js** and npm (versions compatible with CRA 5)
- Backend running and reachable (default **http://localhost:8080**), with CORS allowing the dev origin **http://localhost:3000** (as configured in the backend)

## Configuration

| Variable | Purpose | Default |
|----------|---------|---------|
| `REACT_APP_API_BASE_URL` | Base URL for REST **and** the SockJS endpoint (`{base}/ws`) | `http://localhost:8080` |

Set in `.env` or `.env.local` in this folder (CRA convention: only variables prefixed with `REACT_APP_` are exposed).

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Dev server at [http://localhost:3000](http://localhost:3000) with hot reload |
| `npm run build` | Production build in `build/` |
| `npm test` | Jest / React Testing Library (`*.test.tsx`) |
| `npm run eject` | Irreversible CRA eject (rarely needed) |

## How it fits the backend

- **REST**: JSON under `{API_BASE_URL}/api/...` — login/register, current user, lobby lists, game CRUD, guesses, chat history, etc. The backend issues **JWT** access tokens; the client stores them (see `src/auth/tokenStorage.ts`) and sends `Authorization: Bearer <token>` on API calls.
- **WebSockets**: The client opens **SockJS** to `{API_BASE_URL}/ws`, then connects with **STOMP** using the same Bearer token in `connectHeaders`. Broker prefixes align with Spring’s typical setup: application destinations `/app`, topics `/topic`, user queues `/user/...`.

This mirrors `WebSocketConfig` in the backend (`/ws`, `/app`, `/topic`, `/queue`, `/user`).

## App behavior (routes & features)

| Path | Guard | Role |
|------|--------|------|
| `/login` | Public | Sign in; redirects to `/lobby` on success |
| `/register` | Public | Fetches a registration token from the API, then registers and redirects to `/login` with a success message |
| `/lobby` | Authenticated (`ProtectedRoute`) | Lobby: online players, incoming challenges, lobby chat |
| `/games/:gameId` | Authenticated | Active or pending game: board, guesses, forfeit, rematch flow, per-game chat sidebar |

There is **no** `/` route defined; open `/login` or `/lobby` directly (or bookmark them).

**Auth shell**: `AuthProvider` hydrates the user from a stored token via `GET /api/me`. `ProtectedRoute` sends unauthenticated users to `/login`.

**Lobby** (`LobbyPage`): Initial load uses REST (`/api/lobby/players`, challenges, chat history). **WebSocket** subscriptions keep player list and lobby chat live; new challenges also arrive on `/user/queue/challenges`. Challenges are **polled** every ~3s as a fallback. Sending lobby chat uses STOMP publish to `/app/lobby/chat.send`.

**Game** (`GamePage`): Loads game via `GET /api/games/:id`. Subscribes to `/topic/game/{id}` for full game payload updates, `/topic/game/{id}/presence` for opponent leave events, and `/user/queue/challenges` for rematch notifications. While status is `IN_PROGRESS` or `WAITING_FOR_PLAYER`, state is also **polled** every ~3s (`useGamePolling`). Guesses go through `POST /api/games/:id/guess`. Leaving publishes to `/app/game/{id}/leave`. Game chat (`GameChatPanel`) loads history from REST and subscribes to `/topic/game/{id}/chat`; send uses `/app/game/{id}/chat.send`.

**Wordle UI**: `WordleBoard` + `GuessInput` enforce **5-letter** guesses and show server-provided feedback strings.

## Source layout

```
src/
  api/           # authApi, userApi, lobbyApi, gameApi; shared request() + error typing
  auth/          # AuthContext, token storage, ProtectedRoute
  components/    # layout (AppLayout, NavBar), ui primitives (Button, Input, Spinner, …)
  config/        # env (API base URL)
  features/
    auth/        # LoginPage, RegisterPage
    game/        # GamePage, WordleBoard, GuessInput, GameChatPanel
    lobby/       # LobbyPage, panels (players, challenges, chat)
  hooks/         # useLobbyWebSocket, useGamePolling
  routes/        # Route table
  styles/        # Global CSS; index.css ties variables and layout
  types/         # Shared TS types (API DTOs, domain enums)
  ws/            # STOMP/SockJS singleton client (connect, subscribe, publish)
  App.tsx        # AuthProvider + BrowserRouter + routes
  index.tsx      # Entry
```

## Tests

Colocated tests include `AuthContext.test.tsx`, `httpClient.test.ts`, `tokenStorage.test.ts`, and `App.test.tsx`. Run with `npm test`.

## Related docs

- Backend: `../backend/README.md` — how to run the API, database, and how controllers map to the routes above.
