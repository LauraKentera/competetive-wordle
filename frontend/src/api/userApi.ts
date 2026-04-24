import { request } from "./httpClient";
import { UserResponse } from "../types/api";

export const userApi = {
  getMe: (): Promise<UserResponse> => request("/api/me"),

  getUserById: (id: number): Promise<UserResponse> =>
    request(`/api/users/${id}`),

  updateAvatar: (avatarId: number): Promise<UserResponse> =>
    request("/api/me/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatarId }),
    }),
};