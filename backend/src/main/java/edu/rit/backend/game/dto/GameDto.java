package edu.rit.backend.game.dto;

import java.util.List;

/**
 * Game state for API. Word is never exposed until game ends (if desired by product).
 */
public record GameDto(
        Long id,
        String status,
        Long playerOneId,
        Long playerTwoId,
        Long currentTurnPlayerId,
        Integer wordLength,
        Integer maxAttempts,
        Long winnerId,
        List<GuessDto> guesses,
        String answer
) {}