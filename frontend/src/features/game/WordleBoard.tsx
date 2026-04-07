import React from "react";
import { GuessDto } from "../../types/api";

interface Props {
  guesses: GuessDto[];
}

const TILE_COUNT = 5;

const getTileColors = (patternChar?: string) => {
  switch (patternChar?.toUpperCase()) {
    case "G":
    case "C":
      return {
        background: "#22c55e",
        borderColor: "#16a34a",
        color: "#ffffff",
      };
    case "Y":
    case "P":
      return {
        background: "#f59e0b",
        borderColor: "#d97706",
        color: "#ffffff",
      };
    case "X":
    case "A":
      return {
        background: "#94a3b8",
        borderColor: "#64748b",
        color: "#ffffff",
      };
    default:
      return {
        background: "#ffffff",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
      };
  }
};

const WordleBoard: React.FC<Props> = ({ guesses }) => {
  return (
    <div style={{ display: "grid", gap: "var(--spacing-sm)" }}>
      {guesses.map((guess, rowIndex) => (
        <div
          key={`${guess.playerId}-${guess.attemptNumber}-${rowIndex}`}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${TILE_COUNT}, minmax(0, 1fr))`,
            gap: 8,
          }}
        >
          {Array.from({ length: TILE_COUNT }, (_, letterIndex) => {
            const letter = guess.guessWord[letterIndex]?.toUpperCase() ?? "";
            const { background, borderColor, color } = getTileColors(guess.result[letterIndex]);

            return (
              <div
                key={`${rowIndex}-${letterIndex}`}
                style={{
                  aspectRatio: "1 / 1",
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${borderColor}`,
                  borderRadius: "var(--radius)",
                  background,
                  color,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
                }}
              >
                {letter}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WordleBoard;
