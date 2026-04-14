import React from "react";
import { GuessDto } from "../../types/api";

interface Props { guesses: GuessDto[]; currentUserId: number; }

const TILE_COUNT = 5;

const tileClass = (ch?: string) => {
  switch (ch?.toUpperCase()) {
    case "G": case "C": return "tile tile-correct";
    case "Y": case "P": return "tile tile-present";
    case "X": case "A": return "tile tile-absent";
    default: return "tile tile-empty";
  }
};

const WordleBoard: React.FC<Props> = ({ guesses, currentUserId }) => {
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
          {Array.from({ length: TILE_COUNT }, (_, li) => (
            <div key={li} className={tileClass(guess.result[li])}>
              {guess.guessWord[li]?.toUpperCase() ?? ""}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default WordleBoard;
