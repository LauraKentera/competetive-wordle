import { request } from "./httpClient";
import { GameDto, GuessResult, ChatMessageDto, GuessRequest } from "../types/api";

export const gameApi = {
  createGame: (challengedUserId: number): Promise<GameDto> =>
    request("/api/games", {
      method: "POST",
      body: JSON.stringify({ challengedUserId }),
    }),

  acceptGame: (id: number): Promise<GameDto> =>
    request(`/api/games/${id}/accept`, {
      method: "POST",
    }),

  getGame: (id: number): Promise<GameDto> =>
    request(`/api/games/${id}`),

  submitGuess: (id: number, word: string): Promise<GuessResult> =>
    request(`/api/games/${id}/guess`, {
      method: "POST",
      body: JSON.stringify({ word } as GuessRequest),
    }),

  getGameChat: (id: number, limit?: number): Promise<ChatMessageDto[]> =>
    request(`/api/games/${id}/chat${limit !== undefined ? `?limit=${limit}` : ""}`),
};