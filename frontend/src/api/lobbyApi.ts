import { request } from "./httpClient";
import { LobbyPlayerDto, ChatMessageDto, ChallengeDto, GameDto } from "../types/api";

/**
 * API client for lobby endpoints.
 * Handles online player listings, lobby chat history, pending challenges, and sending challenges.
 */
export const lobbyApi = {
  /**
   * Returns the list of all currently online players in the lobby.
   * GET /api/lobby/players
   *
   * @returns A promise resolving to an array of LobbyPlayerDto objects.
   */
  getPlayers: (): Promise<LobbyPlayerDto[]> =>
    request("/api/lobby/players"),

  /**
   * Returns recent lobby chat messages.
   * GET /api/lobby/chat
   *
   * @param limit - Optional maximum number of messages to retrieve.
   * @returns A promise resolving to an array of ChatMessageDto objects.
   */
  getChatHistory: (limit?: number): Promise<ChatMessageDto[]> =>
    request(`/api/lobby/chat${limit !== undefined ? `?limit=${limit}` : ""}`),

  /**
   * Returns all pending game challenges received by the authenticated user.
   * GET /api/lobby/challenges
   *
   * @returns A promise resolving to an array of ChallengeDto objects.
   */
  getChallenges: (): Promise<ChallengeDto[]> =>
    request("/api/lobby/challenges"),

  /**
   * Sends a game challenge to the specified user.
   * POST /api/lobby/challenge/:userId
   *
   * @param userId - The ID of the user to challenge.
   * @returns A promise resolving to the newly created GameDto.
   */
  challengeUser: (userId: number): Promise<GameDto> =>
    request(`/api/lobby/challenge/${userId}`, { method: "POST" }),
};
