package edu.rit.backend.game.dto;

/**
 * Response after submitting a guess: feedback string (G/Y/X) and whether the guess was correct (win).
 */
public record GuessResult(String result, boolean correct) {}