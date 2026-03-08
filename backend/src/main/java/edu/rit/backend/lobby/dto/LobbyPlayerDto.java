package edu.rit.backend.lobby.dto;

import edu.rit.backend.user.model.UserStatus;

/**
 * Minimal user info for lobby online list.
 */
public record LobbyPlayerDto(Long id, String username, UserStatus status) {}
