import React from "react";
import { GuessDto } from "../../types/api";

interface Props {
  guesses: GuessDto[];
  currentUserId: number;
  concealed?: boolean;
}

const TILE_COUNT = 5;

const isCorrect = (ch?: string) => ch?.toUpperCase() === "G" || ch?.toUpperCase() === "C";

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

const WordleBoard: React.FC<Props> = ({ guesses, currentUserId, concealed = false }) => {
  const myGuesses = guesses.filter((g) => g.playerId === currentUserId);

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
