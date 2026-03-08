package edu.rit.backend.lobby.dto;

/**
 * Pending challenge: game id and challenger info for the invited user.
 */
public record ChallengeDto(Long gameId, Long challengerId, String challengerUsername) {}
