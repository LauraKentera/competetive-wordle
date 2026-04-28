package edu.rit.backend.chat.dto;

import java.util.List;

public record DmRoomDto(Long roomId, List<ChatMessageDto> messages) {
}
