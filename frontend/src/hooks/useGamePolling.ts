import { useEffect, useState } from "react";
import { gameApi } from "../api/gameApi";
import { isApiError } from "../api/httpClient";
import { GameDto } from "../types/api";

/** Shape of the value returned by `useGamePolling`. */
interface UseGamePollingResult {
  /** The most recently fetched game state, or `null` before the first successful fetch. */
  game: GameDto | null;
  /** Human-readable error message if the last fetch failed, or `null` on success. */
  error: string | null;
}

/**
 * How often the hook polls the server for a fresh game state, in milliseconds.
 * Chosen to keep the UI responsive without hammering the backend — the primary
 * real-time update path is the WebSocket subscription on `/topic/game/{id}`;
 * polling is a fallback to recover from missed or delayed WebSocket events.
 */
const POLL_INTERVAL_MS = 3000;

/**
 * Hook that periodically fetches the latest state of a game from the REST API
 * while the game is active.
 *
 * Polling is used alongside the WebSocket subscription on `/topic/game/{id}` as
 * a safety net — it ensures the UI eventually converges to the correct state even
 * if a WebSocket message is dropped or the connection briefly lags.
 *
 * Behaviour:
 * - Fires an immediate fetch as soon as the hook is enabled, then repeats every
 *   `POLL_INTERVAL_MS` milliseconds.
 * - Automatically stops polling once the game reaches a terminal status
 *   (anything other than `IN_PROGRESS` or `WAITING_FOR_PLAYER`).
 * - Cleans up the interval and ignores any in-flight responses on unmount or
 *   when `enabled` / `gameId` change, preventing stale state updates.
 *
 * @param gameId  - The ID of the game to poll. Pass `null` to disable.
 * @param enabled - When `false` the hook does nothing, allowing the caller to
 *                  conditionally activate polling (e.g. only while the game is live).
 * @returns `{ game, error }` — the latest `GameDto` and any fetch error message.
 *
 * @example
 * // Poll while the game is live; stop once it reaches a terminal state.
 * const isLive = status === "IN_PROGRESS" || status === "WAITING_FOR_PLAYER";
 * const { game, error } = useGamePolling(gameId, isLive);
 */
const useGamePolling = (
    gameId: number | null,
    enabled: boolean
): UseGamePollingResult => {
  /** The most recently successfully fetched game state. */
  const [game, setGame] = useState<GameDto | null>(null);
  /** Error message from the last failed fetch attempt, cleared on the next success. */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip setup entirely if polling is disabled or no game ID is provided.
    if (!enabled || gameId === null) return;

    /**
     * Guards against setting state after the component has unmounted or the
     * effect has been re-run with new dependencies. Set to `false` in the
     * cleanup function.
     */
    let isActive = true;

    /**
     * Holds the interval handle so it can be cleared either from within
     * `pollGame` (when the game ends) or from the cleanup function (on unmount).
     * Typed as `number | null` because `window.setInterval` returns a `number`.
     */
    let intervalId: number | null = null;

    /**
     * Fetches the current game state from the API.
     * On success: updates `game` state and clears any previous error.
     * On terminal status: self-cancels the polling interval.
     * On error: sets a human-readable error message via `isApiError` narrowing.
     */
    const pollGame = async () => {
      try {
        const nextGame = await gameApi.getGame(gameId);

        // Discard the result if the effect was cleaned up while the request was in flight.
        if (!isActive) return;

        setGame(nextGame);
        setError(null);

        // Stop polling once the game is in a terminal state — no further changes
        // will come from the server for COMPLETED or DECLINED games.
        if (
            nextGame.status !== "IN_PROGRESS" &&
            nextGame.status !== "WAITING_FOR_PLAYER" &&
            intervalId !== null
        ) {
          window.clearInterval(intervalId);
          intervalId = null;
        }
      } catch (err) {
        // Discard the error if the effect was already cleaned up.
        if (!isActive) return;

        // `isApiError` narrows to `ApiError` (with a `.message` field); fall back
        // to a generic string for unexpected error shapes (network failures, etc.).
        setError(isApiError(err) ? err.message : "Failed to refresh game");
      }
    };

    // Fire an immediate fetch so the UI doesn't wait for the first interval tick.
    void pollGame();

    // Schedule subsequent fetches at the configured interval.
    intervalId = window.setInterval(pollGame, POLL_INTERVAL_MS);

    return () => {
      // Prevent any in-flight fetch from updating state after cleanup.
      isActive = false;
      // Cancel the scheduled interval if it is still running.
      if (intervalId !== null) window.clearInterval(intervalId);
    };
    // Re-run the effect whenever the target game or the enabled flag changes.
  }, [enabled, gameId]);

  return { game, error };
};

export default useGamePolling;