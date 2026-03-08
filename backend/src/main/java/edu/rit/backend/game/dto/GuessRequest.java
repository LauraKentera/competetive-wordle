package edu.rit.backend.game.dto;

/**
 * Request body for submitting a guess. Use "word" to match Postman/API.
 */
public record GuessRequest(String word) {
}