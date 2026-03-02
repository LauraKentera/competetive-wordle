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
React (Create React App)
STOMP WebSocket client

## Infrastructure
Docker (MySQL containerized for local development)

## Project Structure

backend/
auth/
user/
lobby/
game/
chat/
common/

frontend/

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

* Project structure planned
* CRA will be used for development

### Next Steps

* Implement User entity and repository
* Implement JWT authentication
* Implement WebSocket lobby communication
* Define initial database schema for core entities
* Connect frontend login to backend authentication
