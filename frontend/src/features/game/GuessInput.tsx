import React, { useState } from "react";
import { gameApi } from "../../api/gameApi";
import { isApiError } from "../../api/httpClient";
import Button from "../../components/ui/Button";
import ErrorBanner from "../../components/ui/ErrorBanner";
import Input from "../../components/ui/Input";
import { GuessDto, GuessResult } from "../../types/api";

interface Props {
  gameId: number;
  currentUserId: number;
  nextAttemptNumber: number;
  disabled?: boolean;
  disabledMessage?: string | null;
  onGuessSubmitted: (guess: GuessDto, result: GuessResult) => void | Promise<void>;
}

const WORD_LENGTH = 5;

const GuessInput: React.FC<Props> = ({
  gameId,
  currentUserId,
  nextAttemptNumber,
  disabled = false,
  disabledMessage = null,
  onGuessSubmitted,
}) => {
  const [word, setWord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const normalizedWord = word.trim().toLowerCase();
    if (normalizedWord.length !== WORD_LENGTH) {
      setErrorMessage("Guess must be 5 letters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await gameApi.submitGuess(gameId, normalizedWord);

      await onGuessSubmitted(
        {
          playerId: currentUserId,
          guessWord: normalizedWord,
          result: result.result,
          attemptNumber: nextAttemptNumber,
        },
        result
      );

      setWord("");

      if (!result.correct) {
        setErrorMessage("Incorrect guess. Your result has been added to the board.");
      }
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to submit guess");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "var(--spacing-sm)" }}>
      {errorMessage && <ErrorBanner message={errorMessage} />}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "var(--spacing-sm)" }}>
        <Input
          value={word}
          onChange={(event) => {
            setWord(event.target.value.replace(/[^a-zA-Z]/g, "").slice(0, WORD_LENGTH).toUpperCase());
            if (errorMessage) {
              setErrorMessage(null);
            }
          }}
          placeholder="Enter a 5-letter word"
          maxLength={WORD_LENGTH}
          disabled={disabled || isSubmitting}
          aria-label="Guess word"
        />
        <Button type="submit" disabled={disabled || isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </form>

      {disabledMessage && (
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: 14 }}>{disabledMessage}</p>
      )}
    </div>
  );
};

export default GuessInput;
