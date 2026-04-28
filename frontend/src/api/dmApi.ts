import { request } from "./httpClient";
import { ChatMessageDto, DmRoomDto } from "../types/api";

export async function getOrCreateDmRoom(userId: number): Promise<DmRoomDto> {
  return request<DmRoomDto>(`/api/dm/${userId}`);
}

export async function getDmMessages(roomId: number, page = 0): Promise<ChatMessageDto[]> {
  return request<ChatMessageDto[]>(`/api/dm/${roomId}/messages?page=${page}`);
}
