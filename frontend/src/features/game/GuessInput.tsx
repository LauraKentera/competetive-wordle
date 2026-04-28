import React, { useState } from "react";
import { gameApi } from "../../api/gameApi";
import { isApiError } from "../../api/httpClient";
import { GuessDto, GuessResult } from "../../types/api";

interface Props {
  gameId: number;
  currentUserId: number;
  nextAttemptNumber: number;
  disabled?: boolean;
  disabledMessage?: string | null;
  onGuessSubmitted: (guess: GuessDto, result: GuessResult) => void | Promise<void>;
}


/**
 * 
 * GuessInput component
 * 
 * Handles user input for submitting guesses in a Wordle game
 * Responsibilities:
 * Validate user input (must be a 5-letter word)
 * Provide feedback for invalid or incorrect guesses
 * Notify parent component when a guess is successfully submitted
 */
const GuessInput: React.FC<Props> = ({
  gameId, currentUserId, nextAttemptNumber,
  disabled = false, disabledMessage = null, onGuessSubmitted,
}) => {
  // Stores the current input value (user's guess)
  const [word, setWord] = useState("");
  // Tracks whether a guess is currently being submitted to prevent duplicate requests
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Stores validation or API error messages for user feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 
   * Handles guess submission
   * 
   * Prevents default form behavior
   * Validates input length
   * Sends guess to backend
   * Calls parent callback with result
   * Dispaly feedback for incorrect guess
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    // Normalize input (trim and convert to lowercase for backend)
    const w = word.trim().toLowerCase();
    // Ensure guess is exactly 5 letters
    if (w.length !== 5) { setErrorMessage("Guess must be exactly 5 letters."); return; }
    setIsSubmitting(true);
    try {
      // Submit guess to backend API
      const result = await gameApi.submitGuess(gameId, w);
      // Notify parent component to update game state optimistically
      await onGuessSubmitted(
        { playerId: currentUserId, guessWord: w, result: result.result, attemptNumber: nextAttemptNumber },
        result
      );
      // Clear input after successful submission
      setWord("");
      // Show feedback if guess is incorrect
      if (!result.correct) setErrorMessage("incorrect — try again");
    } catch (err) {
      // Handle API errors or fallback message
      setErrorMessage(isApiError(err) ? err.message : "Failed to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {/* Display validation or submission error messages */}
      {errorMessage && <div className="banner-error">{errorMessage}</div>}
      {/* Guess input form */}
      <form onSubmit={handleSubmit} className="guess-row">
        <input
          className="input"
          value={word}
          onChange={(e) => {
            // Restrict input to letters only, max 5 characters, and display in uppercase
            setWord(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase());
            // Clear error message when user starts typing again
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="5-letter word"
          maxLength={5}
          disabled={disabled || isSubmitting}
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase" }}
        />
        {/* Submit button is disabled when input is disabled or request is in progress */}
        <button className="btn btn-primary" type="submit" disabled={disabled || isSubmitting} style={{ whiteSpace: "nowrap" }}>
          {isSubmitting ? "..." : "submit"}
        </button>
      </form>
      {/* Shows why input is disabled */}
      {disabledMessage && (
        <div className="turn-indicator">{disabledMessage}</div>
      )}
    </div>
  );
};

export default GuessInput;
