import { request } from "./httpClient";
import { ChatMessageDto, DmRoomDto } from "../types/api";

/**
 * Returns an existing direct message room with the specified user, or creates one if it does not exist.
 * GET /api/dm/:userId
 *
 * @param userId - The ID of the user to open a DM room with.
 * @returns A promise resolving to the DmRoomDto for the room.
 */
export async function getOrCreateDmRoom(userId: number): Promise<DmRoomDto> {
  return request<DmRoomDto>(`/api/dm/${userId}`);
}

/**
 * Returns a paginated list of messages for the specified direct message room.
 * GET /api/dm/:roomId/messages
 *
 * @param roomId - The ID of the DM room.
 * @param page   - The page number to fetch (0-indexed, defaults to 0).
 * @returns A promise resolving to an array of ChatMessageDto objects.
 */
export async function getDmMessages(roomId: number, page = 0): Promise<ChatMessageDto[]> {
  return request<ChatMessageDto[]>(`/api/dm/${roomId}/messages?page=${page}`);
}
