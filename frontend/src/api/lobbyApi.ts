import { request } from "./httpClient";
import { LobbyPlayerDto, ChatMessageDto, ChallengeDto } from "../types/api";

export const lobbyApi = {
  getPlayers: (): Promise<LobbyPlayerDto[]> =>
    request("/api/lobby/players"),

  getChatHistory: (limit?: number): Promise<ChatMessageDto[]> =>
    request(`/api/lobby/chat${limit !== undefined ? `?limit=${limit}` : ""}`),

  getChallenges: (): Promise<ChallengeDto[]> =>
    request("/api/lobby/challenges"),
};