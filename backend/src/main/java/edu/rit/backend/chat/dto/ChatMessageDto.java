package edu.rit.backend.chat.dto;

import java.time.Instant;

/**
 * Chat message for API and WebSocket broadcast (sender username, content, timestamp).
 */
public record ChatMessageDto(String sender, String content, Instant timestamp) {}
