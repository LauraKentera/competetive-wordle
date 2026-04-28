package edu.rit.backend.chat.dto;

import java.util.List;

// Data Transfer Object representing a direct message room
// Contains the room identifier and its associated messages
public record DmRoomDto(Long roomId, List<ChatMessageDto> messages) {
}