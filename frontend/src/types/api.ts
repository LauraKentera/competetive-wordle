import { Role, UserStatus } from "./domain";

/* =========================
   AUTH DTOs
========================= */

/** Authentication result payload returned after successful login. */
export interface AuthResponse {
  /** JWT access token used for authenticated API calls. */
  accessToken: string;
  /** Token scheme (commonly "Bearer"). */
  tokenType: string;
  /** Token validity duration in seconds from issuance. */
  expiresInSeconds: number;
  /** Authenticated user's username. */
  username: string;
  /** Authenticated user's authorization role. */
  role: Role;
}

/** Payload sent to authenticate an existing user. */
export interface LoginRequest {
  /** Unique username credential. */
  username: string;
  /** Plain-text password submitted for authentication. */
  password: string;
}

/** Payload sent to register a new user account. */
export interface RegisterRequest {
  /** Desired username for the new account. */
  username: string;
  /** Plain-text password selected by the user. */
  password: string;
  /** One-time registration token issued by the backend. */
  registrationToken: string;
}

/** Registration token metadata returned by the API. */
export interface RegistrationTokenResponse {
  /** Registration token string value. */
  token: string;
  /** Expiration timestamp (ISO string). */
  expiresAt: string; // Instant -> string
}

/* =========================
   USER DTOs
========================= */

/** Public user profile and aggregate gameplay statistics. */
export interface UserResponse {
  /** Internal numeric user identifier. */
  id: number;
  /** Unique username displayed across the app. */
  username: string;
  /** Current authorization role for this user. */
  role: Role;
  /** Presence/activity status of the user. */
  status: UserStatus;
  /** Most recent login timestamp, or null if never logged in. */
  lastLogin: string | null; // Instant -> string (nullable)
  /** Selected avatar identifier. */
  avatarId: number;
  /** Total completed games. */
  gamesPlayed: number;
  /** Total wins. */
  gamesWon: number;
  /** Total losses. */
  gamesLost: number;
  /** Total draws. */
  gamesDrawn: number;
  /** Total forfeited games. */
  gamesForfeited: number;
}

/* =========================
   ERROR DTO
========================= */

/** Standardized API error payload returned by the backend. */
export interface ApiError {
  /** Error occurrence timestamp (ISO string). */
  timestamp: string; // Instant -> string
  /** HTTP status code. */
  status: number;
  /** HTTP status text or high-level error classification. */
  error: string;
  /** Human-readable error description. */
  message: string;
  /** Request path associated with the error. */
  path: string;
}

/* =========================
   CHAT DTOs
========================= */

/** Single chat message DTO used in DM and game chat contexts. */
export interface ChatMessageDto {
  /** Username of the message sender. */
  sender: string;
  /** Raw chat message body. */
  content: string;
  /** Message creation timestamp (ISO string). */
  timestamp: string; // Instant -> string
}

/** Payload used to send a message to game chat. */
export interface GameChatSendRequest {
  /** Message content to send. */
  content: string;
}

/** Direct-message room snapshot including room id and messages. */
export interface DmRoomDto {
  /** Numeric identifier for the DM room. */
  roomId: number;
  /** Chronological list of messages in the room. */
  messages: ChatMessageDto[];
}

/* =========================
   LOBBY DTOs
========================= */

/** Lightweight player representation for lobby views. */
export interface LobbyPlayerDto {
  /** Player's numeric user identifier. */
  id: number;
  /** Player username shown in lobby participants. */
  username: string;
  /** Current player presence/activity status. */
  status: UserStatus;
  /** Avatar id selected by the player. */
  avatarId: number;
}

/** Lobby chat message format. */
export interface LobbyChatMessage {
  /** Username of message sender. */
  sender: string;
  /** Message text content. */
  content: string;
  /** Message timestamp (ISO string). */
  timestamp: string; // Instant -> string
}

/** Challenge invitation details emitted from lobby interactions. */
export interface ChallengeDto {
  /** Game id created for the challenge. */
  gameId: number;
  /** User id of the challenger. */
  challengerId: number;
  /** Username of the challenger. */
  challengerUsername: string;
}

/* =========================
   FRIEND DTOs
========================= */

/** State of a friendship relationship between two users. */
export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

/** Friendship relationship DTO including the counterpart user. */
export interface FriendshipDto {
  /** Relationship record identifier. */
  id: number;
  /** The related user in this friendship entry. */
  user: UserResponse;
  /** Current relationship status. */
  status: FriendshipStatus;
  /** Relationship creation timestamp (ISO string). */
  createdAt: string;
}

/* =========================
   GAME DTOs
========================= */

/** Primary game snapshot returned by game endpoints. */
export interface GameDto {
  /** Unique game identifier. */
  id: number;
  /** Backend-reported game lifecycle status. */
  status: string;
  /** User id of player one. */
  playerOneId: number;
  /** User id of player two, when joined. */
  playerTwoId: number | null;
  /** User id whose turn it currently is. */
  currentTurnPlayerId: number | null;
  /** Expected answer word length. */
  wordLength: number | null;
  /** Maximum allowed guess attempts per player. */
  maxAttempts: number | null;
  /** Winner user id, or null until resolution. */
  winnerId: number | null;
  /** All guesses made so far in the game. */
  guesses: GuessDto[];
  /** Revealed answer string, generally only after game end. */
  answer: string | null;
}

/** Individual guess entry captured in a game. */
export interface GuessDto {
  /** User id of the player who made the guess. */
  playerId: number;
  /** Word guessed by the player. */
  guessWord: string;
  /** Encoded match feedback from backend. */
  result: string;
  /** 1-based attempt number for this guess. */
  attemptNumber: number;
}

/** Payload used when submitting a guess. */
export interface GuessRequest {
  /** Guessed word text. */
  word: string;
}

/** Response returned after evaluating a guess. */
export interface GuessResult {
  /** Encoded evaluation result for the submitted word. */
  result: string;
  /** Whether the guess exactly matches the answer. */
  correct: boolean;
}
