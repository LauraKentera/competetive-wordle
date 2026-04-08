import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { gameApi } from "../../api/gameApi";
import { isApiError } from "../../api/httpClient";
import { useAuth } from "../../auth";
import Button from "../../components/ui/Button";
import ErrorBanner from "../../components/ui/ErrorBanner";
import Spinner from "../../components/ui/Spinner";
import useGamePolling from "../../hooks/useGamePolling";
import { GameDto, GuessDto, GuessResult } from "../../types/api";
import GuessInput from "./GuessInput";
import GameChatPanel from "./GameChatPanel";
import WordleBoard from "./WordleBoard";

type GamePageGame = Omit<GameDto, "playerTwoId" | "currentTurnPlayerId" | "winnerId"> & {
  playerTwoId?: number | null;
  currentTurnPlayerId?: number | null;
  winnerId?: number | null;
  challengedUserId?: number | null;
};

const GamePage: React.FC = () => {
  const { gameId: gameIdParam } = useParams();
  const { user } = useAuth();
  const [game, setGame] = useState<GamePageGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const gameId = useMemo(() => {
    const parsed = Number(gameIdParam);
    return Number.isFinite(parsed) ? parsed : null;
  }, [gameIdParam]);

  const loadGame = useCallback(
    async (showSpinner = false) => {
      if (gameId === null) {
        setErrorMessage("Invalid game id.");
        setIsLoading(false);
        return null;
      }

      if (showSpinner) {
        setIsLoading(true);
      }

      try {
        const nextGame = (await gameApi.getGame(gameId)) as GamePageGame;
        setGame(nextGame);
        setErrorMessage(null);
        return nextGame;
      } catch (err) {
        setErrorMessage(isApiError(err) ? err.message : "Failed to load game");
        return null;
      } finally {
        if (showSpinner) {
          setIsLoading(false);
        }
      }
    },
    [gameId]
  );

  useEffect(() => {
    void loadGame(true);
  }, [loadGame]);

  const { game: polledGame, error: pollingError } = useGamePolling(
    gameId,
    game?.status === "IN_PROGRESS"
  );

  useEffect(() => {
    if (polledGame) {
      setGame(polledGame as GamePageGame);
      setErrorMessage(null);
    }
  }, [polledGame]);

  useEffect(() => {
    if (pollingError) {
      setErrorMessage(pollingError);
    }
  }, [pollingError]);

  const challengedUserId = game?.challengedUserId ?? null;
  const isPending = game?.status === "PENDING";
  const canAccept = Boolean(
    game && user && isPending && challengedUserId === user.id
  );
  const isInProgress = game?.status === "IN_PROGRESS";
  const isPlayersTurn = Boolean(isInProgress && game?.currentTurnPlayerId === user?.id);
  const lastAttemptNumber = game ? game.guesses[game.guesses.length - 1]?.attemptNumber ?? 0 : 0;
  const nextAttemptNumber = lastAttemptNumber + 1;

  const handleAccept = async () => {
    if (gameId === null) {
      return;
    }

    setIsAccepting(true);
    setErrorMessage(null);

    try {
      await gameApi.acceptGame(gameId);
      await loadGame();
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to accept challenge");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleGuessSubmitted = async (guess: GuessDto, result: GuessResult) => {
    setGame((currentGame: GamePageGame | null) => {
      if (!currentGame) {
        return currentGame;
      }

      const otherPlayerId =
        guess.playerId === currentGame.playerOneId ? currentGame.playerTwoId : currentGame.playerOneId;

      return {
        ...currentGame,
        guesses: [...currentGame.guesses, guess],
        currentTurnPlayerId: result.correct ? null : otherPlayerId,
        status: result.correct ? "COMPLETED" : currentGame.status,
        winnerId: result.correct ? guess.playerId : currentGame.winnerId,
      };
    });

    await loadGame();
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
        <Spinner />
      </div>
    );
  }

  if (!game) {
    return <ErrorBanner message={errorMessage ?? "Game not found"} />;
  }

  const winnerLabel =
    game.winnerId == null ? "Draw" : game.winnerId === user?.id ? "You won" : "Opponent won";

  return (
    <div style={{ display: "grid", gap: "var(--spacing-md)", maxWidth: 640, margin: "0 auto" }}>
      {errorMessage && <ErrorBanner message={errorMessage} />}

      <section
        style={{
          display: "grid",
          gap: "var(--spacing-sm)",
          border: "1px solid var(--color-border)",
          borderRadius: 14,
          background: "var(--color-surface)",
          padding: "var(--spacing-lg)",
          boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--spacing-md)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <h1 style={{ margin: 0, fontSize: 28 }}>Game #{game.id}</h1>
            <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
              Status: {game.status}
              {isInProgress && (
                <> · {isPlayersTurn ? "Your turn" : "Waiting for your opponent"}</>
              )}
              {game.status === "COMPLETED" && <> · {winnerLabel}</>}
            </p>
          </div>

          {canAccept && (
            <Button onClick={handleAccept} disabled={isAccepting}>
              {isAccepting ? "Accepting..." : "Accept"}
            </Button>
          )}
        </div>

        {isPending && !canAccept && (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>
            Waiting for the challenged player to accept this game.
          </p>
        )}

        <WordleBoard guesses={game.guesses} />

        {isInProgress && user && (
          <GuessInput
            gameId={game.id}
            currentUserId={user.id}
            nextAttemptNumber={nextAttemptNumber}
            disabled={!isPlayersTurn}
            disabledMessage={isPlayersTurn ? null : "You can submit a guess when it is your turn."}
            onGuessSubmitted={handleGuessSubmitted}
          />
        )}

        {game && <GameChatPanel gameId={game.id.toString()} />}
      </section>
    </div>
  );
};

export default GamePage;
