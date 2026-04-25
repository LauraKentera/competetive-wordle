import { Role, UserStatus } from "./domain";

/* =========================
   AUTH DTOs
========================= */

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  username: string;
  role: Role;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  registrationToken: string;
}

export interface RegistrationTokenResponse {
  token: string;
  expiresAt: string; // Instant -> string
}

/* =========================
   USER DTOs
========================= */

export interface UserResponse {
  id: number;
  username: string;
  role: Role;
  status: UserStatus;
  lastLogin: string | null; // Instant -> string (nullable)
  avatarId: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  gamesDrawn: number;
  gamesForfeited: number;
}

/* =========================
   ERROR DTO
========================= */

export interface ApiError {
  timestamp: string; // Instant -> string
  status: number;
  error: string;
  message: string;
  path: string;
}

/* =========================
   CHAT DTOs
========================= */

export interface ChatMessageDto {
  sender: string;
  content: string;
  timestamp: string; // Instant -> string
}

export interface GameChatSendRequest {
  content: string;
}

/* =========================
   LOBBY DTOs
========================= */

export interface LobbyPlayerDto {
  id: number;
  username: string;
  status: UserStatus;
  avatarId: number;
}

export interface LobbyChatMessage {
  sender: string;
  content: string;
  timestamp: string; // Instant -> string
}

export interface ChallengeDto {
  gameId: number;
  challengerId: number;
  challengerUsername: string;
}

/* =========================
   GAME DTOs
========================= */

export interface GameDto {
  id: number;
  status: string;
  playerOneId: number;
  playerTwoId: number | null;
  currentTurnPlayerId: number | null;
  wordLength: number | null;
  maxAttempts: number | null;
  winnerId: number | null;
  guesses: GuessDto[];
  answer: string | null;
}

export interface GuessDto {
  playerId: number;
  guessWord: string;
  result: string;
  attemptNumber: number;
}

export interface GuessRequest {
  word: string;
}

export interface GuessResult {
  result: string;
  correct: boolean;
}
