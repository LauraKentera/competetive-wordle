package edu.rit.backend.game.dto;

/**
 * A single guess in a game (for board reconstruction). Secret word is never exposed.
 */
public record GuessDto(Long playerId, String guessWord, String result, int attemptNumber) {}
