package edu.rit.backend.lobby.dto;

import java.time.Instant;

/**
 * Lobby chat message payload.
 */
public record LobbyChatMessage(
        String sender,
        String content,
        Instant timestamp
) {}
