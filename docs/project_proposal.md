# Project Proposal
## Competitive Wordle – Turn-Based Multiplayer Web Game
### Project Overview
The goal of this project is to design and implement a database-driven, turn-based, multiplayer web game in which two players compete in a competitive version of Wordle. The application will be built as a full-stack web application with user authentication, a real-time lobby, live chat, and persistent game state.
Players will log in, enter a lobby, challenge other players to a match, and, once a challenge is accepted, be redirected to a shared game session. Gameplay is strictly turn-based and enforced by the server to ensure fairness and prevent illegal moves. The game state will be stored in the database to preserve progress even if the page is refreshed.
The project emphasizes proper architecture, security, real-time communication, and state management, as required by the assignment.

### Team Roles and Responsibilities
The project will be developed collaboratively, with responsibilities divided across key technical areas. No project manager role is used, in accordance with the project requirements.
#### Backend Development
- Implementation of Spring Boot REST APIs
- Game logic and turn enforcement
- WebSocket server configuration
- Authentication and security using Spring Security and JWT
- Database integration and persistence handling


#### Frontend Development
- React user interface implementation
- SVG-based Wordle board rendering
- WebSocket client for real-time updates and chat
- State management and navigation between login, lobby, and game views
#### Database and Deployment
- Design and maintenance of the MySQL database schema
- Implementation of the ER model and relationships
- Optional Redis caching configuration
- Docker containerization and deployment setup
#### Testing and Quality Assurance
- Unit and integration testing of backend services
- Frontend component and gameplay testing
- Validation of security, authentication, and turn enforcement
- Bug tracking and final system verification
### Game Description and Rules
#### Game Concept
Competitive Wordle is a two-player game in which both players attempt to guess the same hidden word. Players take turns submitting guesses, and feedback is provided after each guess in the form of colored tiles indicating letter correctness.
The objective is to guess the word before the opponent, using the fewest possible turns.
#### Gameplay Rules
- The game supports exactly two players per session
- The server randomly selects a hidden word at the start of the game
- The same word is used for both players
- Players take turns submitting guesses
- Each turn allows one guess
- The first player to guess the word correctly wins
- If both players run out of allowed guesses, the game ends in a draw
- Players may voluntarily end the game early
#### Turn Management
- The first player is chosen via a server-side coin flip
- Turn ownership is stored in the database
- The backend strictly enforces turn order
- Any attempt to play when it is not a player’s turn is rejected with feedback
### User Workflow
The application follows the workflow required by the project requirements:
1. Login
- Users accessing the site without a valid session token are redirected to the login page
- New users can register from the login page
2. Lobby
- After login, users enter a lobby
- All logged-in users can see a list of other online players
- Players can chat in the lobby using WebSockets
- A player can challenge another player to a game
3. Game Session
- Once a challenge is accepted, both players are redirected to the game board
- Players can chat with each other (separate from lobby chat)
- The UI clearly indicates whose turn it is
- The game board updates automatically without page refresh
4. Game End
- Both players are notified when the game ends
- Players are returned to the lobby after exiting the game
### Chat System
- Real-time chat is implemented using WebSockets
- Separate chat rooms:
  - One for the lobby
  - One per game session
- Chat messages include:
  - Sender username
  - Message content
  - Timestamp
- Chat messages are stored in the database
No pre-built chat libraries will be used.
### Persistence and State Management
The following data will be persisted:
- User accounts and credentials
- Active and completed games
- Turn ownership
- Player guesses
- Game outcomes
- Chat messages
- Friend relationships (optional extension)

If a player refreshes the page:
- The game resumes from the last stored state
- The current turn is preserved
- The board is re-rendered from database data
### Security and Authentication
#### Authentication
- Users authenticate using username and password
- Authentication is handled using Spring Security
- Sessions are managed using JWT tokens
#### Secure Registration Token (Nonce)
To prevent abuse during registration, a custom token is used:
- The token is generated on the server
- The token includes:
  - Timestamp
  - Client IP address
  - User-Agent information
- The token is sent to the client with the registration page
- Upon submission:
  - Token is validated against the stored value
  - Token expiration is checked
  - Client metadata is verified
#### Technology Stack
##### Backend
- Java
- Spring Boot
- Spring Security
- RESTful APIs
- WebSockets (STOMP)
##### Frontend
- React
- SVG for game board rendering
- WebSocket client for real-time updates
##### Database
- MySQL (persistent storage)
- Redis (optional caching for sessions and active games)
##### Logging
- Log4J
##### Deployment
- Docker (containerized frontend and backend)

All database queries will use prepared statements or parameterized queries, and all user input will be validated and sanitized.
### System Architecture
The system will follow a layered architecture:
Presentation Layer
React frontend
SVG rendering
WebSocket client
Application Layer
REST controllers
WebSocket handlers
Game logic services
Persistence Layer
Database access via repositories
Game state storage
Chat message persistence
This structure ensures maintainability, scalability, and separation of concerns. Persistent data is managed through a relational database, whose structure is detailed in the Entity–Relationship diagram in the following section.
Entity–Relationship (ER) Diagram
The following section describes the database design used to support user management, turn-based gameplay, chat functionality, and persistent game state. The Entity–Relationship diagram illustrates the core entities, their attributes, and relationships, ensuring data consistency and scalability.
Entity: User
Represents a registered player.
Attributes
user_id (PK, INT, auto-increment)
username (VARCHAR(50), UNIQUE, NOT NULL)
password_hash (VARCHAR(255), NOT NULL)
created_at (TIMESTAMP, NOT NULL)
last_login (TIMESTAMP, NULL)
status (ENUM: ONLINE, OFFLINE, IN_GAME)
Notes
Passwords are hashed, never stored in plain text
status is used for lobby visibility
Entity: Friend
Represents a friendship relationship between two users.
Attributes
friend_id (PK, INT, auto-increment)
user_id (FK → User.user_id)
friend_user_id (FK → User.user_id)
created_at (TIMESTAMP)
Relationships
User ⟷ User (many-to-many via Friend)
Notes
Prevent duplicate friendships using a composite unique constraint
Entity: Game
Represents a single Wordle match.
Attributes
game_id (PK, INT, auto-increment)
player_one_id (FK → User.user_id)
player_two_id (FK → User.user_id)
current_turn_player_id (FK → User.user_id)
word (VARCHAR(10), NOT NULL)
word_length (INT, NOT NULL)
max_attempts (INT, NOT NULL)
status (ENUM: WAITING, ACTIVE, FINISHED)
winner_id (FK → User.user_id, NULLABLE)
created_at (TIMESTAMP)
ended_at (TIMESTAMP, NULLABLE)
Relationships
One Game → Two Users
One Game → One Current Turn Owner
One Game → Zero or One Winner
Notes
word may be hidden or hashed until game end
Turn enforcement is based on current_turn_player_id
Entity: Guess
Represents a single Wordle guess.
Attributes
guess_id (PK, INT, auto-increment)
game_id (FK → Game.game_id)
user_id (FK → User.user_id)
guess_word (VARCHAR(10), NOT NULL)
guess_number (INT, NOT NULL)
created_at (TIMESTAMP)
Relationships
One Game → Many Guesses
One User → Many Guesses
Notes
Used to reconstruct boards on page reload
guess_number ensures correct turn/attempt order
Entity: ChatRoom
Represents a chat context.
Attributes
chat_room_id (PK, INT, auto-increment)
type (ENUM: LOBBY, GAME)
game_id (FK → Game.game_id, NULLABLE)
Relationships
One Game → One ChatRoom (GAME type)
One Lobby → One ChatRoom (LOBBY type)
Entity: ChatMessage
Represents a chat message.
Attributes
message_id (PK, INT, auto-increment)
chat_room_id (FK → ChatRoom.chat_room_id)
user_id (FK → User.user_id)
message (TEXT, NOT NULL)
sent_at (TIMESTAMP)
Relationships
One ChatRoom → Many ChatMessages
One User → Many ChatMessages
Entity: RegistrationToken
Represents the secure nonce required for registration.
Attributes
token_id (PK, INT, auto-increment)
token (VARCHAR(255), NOT NULL)
ip_address (VARCHAR(45))
user_agent (VARCHAR(255))
created_at (TIMESTAMP)
expires_at (TIMESTAMP)
used (BOOLEAN, DEFAULT false)
Notes
Token is validated before user creation
Prevents replay and bot registrations
Entity Relationship Summary (High-Level)

Conclusion
Competitive Wordle is a well-scoped, turn-based multiplayer web application that meets all core project requirements. The game’s simplicity allows focus on proper architecture, real-time communication, security, and state management, while still offering room for meaningful extensions and polish.

