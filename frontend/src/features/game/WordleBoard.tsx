import React from "react";
import { GuessDto } from "../../types/api";

interface Props {
  guesses: GuessDto[];
  currentUserId: number;
  concealed?: boolean;
}

// Wordle guesses are always displayed as 5-letter rows
const TILE_COUNT = 5;

/**
 * Checks whether a result character represents a correct letter.
 * 
 * Supports both possible backend result formats: 
 * G / Y / X 
 * C / P / A
 */
const isCorrect = (ch?: string) => ch?.toUpperCase() === "G" || ch?.toUpperCase() === "C";

/**
 * 
 * Returns the CSS class for a tile based on the guess result.
 * 
 * When concealed mode is enabled, only correct letters are shown.
 * Non-correct letters are hidden to avoid revealing the opponent's full guess. 
 */
const tileClass = (ch?: string, concealed?: boolean) => {
  if (concealed && !isCorrect(ch)) {
    if (!ch) return "tile tile-empty";
    return "tile tile-concealed";
  }
  switch (ch?.toUpperCase()) {
    case "G": case "C": return "tile tile-correct";
    case "Y": case "P": return "tile tile-present";
    case "X": case "A": return "tile tile-absent";
    default: return "tile tile-empty";
  }
};

/**
 * 
 * WorldeBoard component
 * 
 * Displays a player's guesses as Wordle-style tile rows.
 * Responsibilities:
 * Filter guesses for a specific player
 * Convert backend guess results into tile styling
 * Optionally conceal opponent guesses until the game is completed
 * Render an empty row when no guesses have been made yet
 */
const WordleBoard: React.FC<Props> = ({ guesses, currentUserId, concealed = false }) => {
  const myGuesses = guesses.filter((g) => g.playerId === currentUserId);

  // Empty board state shown before the player makes their first guess
  if (myGuesses.length === 0) {
    return (
      <div className="board-rows">
        <div className="board-row">
          {Array.from({ length: TILE_COUNT }).map((_, i) => (
            <div key={i} className="tile tile-empty" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="board-rows">
      {myGuesses.map((guess, ri) => (
        <div key={`${guess.playerId}-${guess.attemptNumber}-${ri}`} className="board-row fade-in">
          {Array.from({ length: TILE_COUNT }, (_, li) => {
            const resultChar = guess.result[li];
            // In concealed mode, only correctly guessed letters are visible
            const showLetter = !concealed || isCorrect(resultChar);
            return (
              <div key={li} className={tileClass(resultChar, concealed)}>
                {showLetter ? (guess.guessWord[li]?.toUpperCase() ?? "") : ""}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WordleBoard;
