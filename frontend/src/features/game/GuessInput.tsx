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

const GuessInput: React.FC<Props> = ({
  gameId, currentUserId, nextAttemptNumber,
  disabled = false, disabledMessage = null, onGuessSubmitted,
}) => {
  const [word, setWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const w = word.trim().toLowerCase();
    if (w.length !== 5) { setErrorMessage("Guess must be exactly 5 letters."); return; }
    setIsSubmitting(true);
    try {
      const result = await gameApi.submitGuess(gameId, w);
      await onGuessSubmitted(
        { playerId: currentUserId, guessWord: w, result: result.result, attemptNumber: nextAttemptNumber },
        result
      );
      setWord("");
      if (!result.correct) setErrorMessage("incorrect — try again");
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {errorMessage && <div className="banner-error">{errorMessage}</div>}
      <form onSubmit={handleSubmit} className="guess-row">
        <input
          className="input"
          value={word}
          onChange={(e) => {
            setWord(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 5).toUpperCase());
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="5-letter word"
          maxLength={5}
          disabled={disabled || isSubmitting}
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.15em", textTransform: "uppercase" }}
        />
        <button className="btn btn-primary" type="submit" disabled={disabled || isSubmitting} style={{ whiteSpace: "nowrap" }}>
          {isSubmitting ? "..." : "submit"}
        </button>
      </form>
      {disabledMessage && (
        <div className="turn-indicator">{disabledMessage}</div>
      )}
    </div>
  );
};

export default GuessInput;
