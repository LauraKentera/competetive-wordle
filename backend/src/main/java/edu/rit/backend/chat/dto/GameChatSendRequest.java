package edu.rit.backend.chat.dto;

/**
 * Incoming game chat message from WebSocket (client sends only content).
 */
public record GameChatSendRequest(String content) {}
