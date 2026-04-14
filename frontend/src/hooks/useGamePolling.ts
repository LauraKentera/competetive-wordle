import { useEffect, useState } from "react";
import { gameApi } from "../api/gameApi";
import { isApiError } from "../api/httpClient";
import { GameDto } from "../types/api";

interface UseGamePollingResult {
  game: GameDto | null;
  error: string | null;
}

const POLL_INTERVAL_MS = 3000;

const useGamePolling = (
  gameId: number | null,
  enabled: boolean
): UseGamePollingResult => {
  const [game, setGame] = useState<GameDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || gameId === null) return;

    let isActive = true;
    let intervalId: number | null = null;

    const pollGame = async () => {
      try {
        const nextGame = await gameApi.getGame(gameId);
        if (!isActive) return;
        setGame(nextGame);
        setError(null);
        if (nextGame.status !== "IN_PROGRESS" && nextGame.status !== "WAITING_FOR_PLAYER" && intervalId !== null) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        if (!isActive) return;
        setError(isApiError(err) ? err.message : "Failed to refresh game");
      }
    };

    void pollGame();
    intervalId = window.setInterval(pollGame, POLL_INTERVAL_MS);

    return () => {
      isActive = false;
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [enabled, gameId]);

  return { game, error };
};

export default useGamePolling;