import { request } from "./httpClient";
import { FriendshipDto, UserResponse } from "../types/api";

export async function sendFriendRequest(userId: number): Promise<FriendshipDto> {
  return request<FriendshipDto>(`/api/friends/request/${userId}`, { method: "POST" });
}

export async function acceptFriendRequest(friendshipId: number): Promise<FriendshipDto> {
  return request<FriendshipDto>(`/api/friends/accept/${friendshipId}`, { method: "POST" });
}

export async function rejectFriendRequest(friendshipId: number): Promise<void> {
  return request<void>(`/api/friends/reject/${friendshipId}`, { method: "POST" });
}

export async function getFriends(): Promise<UserResponse[]> {
  return request<UserResponse[]>("/api/friends");
}

export async function getPendingRequests(): Promise<FriendshipDto[]> {
  return request<FriendshipDto[]>("/api/friends/pending");
}

export async function removeFriend(userId: number): Promise<void> {
  return request<void>(`/api/friends/${userId}`, { method: "DELETE" });
}
