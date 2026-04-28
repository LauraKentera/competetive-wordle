import { request } from "./httpClient";
import { GameDto, GuessResult, ChatMessageDto, GuessRequest } from "../types/api";

/**
 * API client for game endpoints.
 * Handles game creation, acceptance, guesses, chat, and game outcome actions.
 */
export const gameApi = {
  /**
   * Creates a new game challenge directed at the specified user.
   * POST /api/games
   *
   * @param challengedUserId - The ID of the user to challenge.
   * @returns A promise resolving to the created GameDto.
   */
  createGame: (challengedUserId: number): Promise<GameDto> =>
    request("/api/games", {
      method: "POST",
      body: JSON.stringify({ challengedUserId }),
    }),

  /**
   * Accepts a pending game challenge.
   * POST /api/games/:id/accept
   *
   * @param id - The ID of the game to accept.
   * @returns A promise resolving to the updated GameDto.
   */
  acceptGame: (id: number): Promise<GameDto> =>
    request(`/api/games/${id}/accept`, {
      method: "POST",
    }),

  /**
   * Returns the current state of a game.
   * GET /api/games/:id
   *
   * @param id - The ID of the game to retrieve.
   * @returns A promise resolving to the GameDto.
   */
  getGame: (id: number): Promise<GameDto> =>
    request(`/api/games/${id}`),

  /**
   * Submits a word guess for the specified game.
   * POST /api/games/:id/guess
   *
   * @param id   - The ID of the game.
   * @param word - The guessed word.
   * @returns A promise resolving to the GuessResult with tile feedback.
   */
  submitGuess: (id: number, word: string): Promise<GuessResult> =>
    request(`/api/games/${id}/guess`, {
      method: "POST",
      body: JSON.stringify({ word } as GuessRequest),
    }),

  /**
   * Returns recent chat messages for the specified game.
   * GET /api/games/:id/chat
   *
   * @param id    - The ID of the game.
   * @param limit - Optional maximum number of messages to retrieve.
   * @returns A promise resolving to an array of ChatMessageDto objects.
   */
  getGameChat: (id: number, limit?: number): Promise<ChatMessageDto[]> =>
    request(`/api/games/${id}/chat${limit !== undefined ? `?limit=${limit}` : ""}`),

  /**
   * Declines a pending game challenge.
   * POST /api/games/:id/decline
   *
   * @param id - The ID of the game to decline.
   * @returns A promise resolving to the updated GameDto.
   */
  declineGame: (id: number): Promise<GameDto> =>
    request(`/api/games/${id}/decline`, {
      method: "POST",
    }),

  /**
   * Forfeits an active game on behalf of the authenticated user.
   * POST /api/games/:id/forfeit
   *
   * @param id - The ID of the game to forfeit.
   * @returns A promise resolving to the updated GameDto.
   */
  forfeitGame: (id: number): Promise<GameDto> =>
    request(`/api/games/${id}/forfeit`, { method: "POST" }),
};