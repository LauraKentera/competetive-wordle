import { request } from "./httpClient";
import { FriendshipDto, UserResponse } from "../types/api";

/**
 * Sends a friend request from the authenticated user to the specified user.
 * POST /api/friends/request/:userId
 *
 * @param userId - The ID of the user to send a friend request to.
 * @returns A promise resolving to the created FriendshipDto.
 */
export async function sendFriendRequest(userId: number): Promise<FriendshipDto> {
  return request<FriendshipDto>(`/api/friends/request/${userId}`, { method: "POST" });
}

/**
 * Accepts an incoming friend request.
 * POST /api/friends/accept/:friendshipId
 *
 * @param friendshipId - The ID of the friendship request to accept.
 * @returns A promise resolving to the updated FriendshipDto.
 */
export async function acceptFriendRequest(friendshipId: number): Promise<FriendshipDto> {
  return request<FriendshipDto>(`/api/friends/accept/${friendshipId}`, { method: "POST" });
}

/**
 * Rejects an incoming friend request.
 * POST /api/friends/reject/:friendshipId
 *
 * @param friendshipId - The ID of the friendship request to reject.
 * @returns A promise resolving to void.
 */
export async function rejectFriendRequest(friendshipId: number): Promise<void> {
  return request<void>(`/api/friends/reject/${friendshipId}`, { method: "POST" });
}

/**
 * Returns the list of accepted friends for the authenticated user.
 * GET /api/friends
 *
 * @returns A promise resolving to an array of UserResponse objects.
 */
export async function getFriends(): Promise<UserResponse[]> {
  return request<UserResponse[]>("/api/friends");
}

/**
 * Returns all pending friend requests received by the authenticated user.
 * GET /api/friends/pending
 *
 * @returns A promise resolving to an array of FriendshipDto objects.
 */
export async function getPendingRequests(): Promise<FriendshipDto[]> {
  return request<FriendshipDto[]>("/api/friends/pending");
}

/**
 * Removes an existing friendship between the authenticated user and the specified user.
 * DELETE /api/friends/:userId
 *
 * @param userId - The ID of the friend to remove.
 * @returns A promise resolving to void.
 */
export async function removeFriend(userId: number): Promise<void> {
  return request<void>(`/api/friends/${userId}`, { method: "DELETE" });
}
