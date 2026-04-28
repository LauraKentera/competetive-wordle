import { request } from "./httpClient";
import { UserResponse } from "../types/api";

/**
 * API client for user profile endpoints.
 * Handles fetching and updating user data.
 */
export const userApi = {
  /**
   * Returns the profile of the currently authenticated user.
   * GET /api/me
   *
   * @returns A promise resolving to the authenticated user's UserResponse.
   */
  getMe: (): Promise<UserResponse> => request("/api/me"),

  /**
   * Returns the public profile of a user by their ID.
   * GET /api/users/:id
   *
   * @param id - The ID of the user to retrieve.
   * @returns A promise resolving to the user's UserResponse.
   */
  getUserById: (id: number): Promise<UserResponse> =>
    request(`/api/users/${id}`),

  /**
   * Updates the avatar of the currently authenticated user.
   * PATCH /api/me/avatar
   *
   * @param avatarId - The ID of the avatar to set.
   * @returns A promise resolving to the updated UserResponse.
   */
  updateAvatar: (avatarId: number): Promise<UserResponse> =>
    request("/api/me/avatar", {
      method: "PATCH",
      body: JSON.stringify({ avatarId }),
    }),
};