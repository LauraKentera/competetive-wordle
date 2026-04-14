import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { gameApi } from "../../api/gameApi";
import { userApi } from "../../api/userApi";
import { lobbyApi } from "../../api/lobbyApi";
import { isApiError } from "../../api/httpClient";
import { useAuth } from "../../auth";
import Spinner from "../../components/ui/Spinner";
import useGamePolling from "../../hooks/useGamePolling";
import { ChallengeDto, GameDto, GuessDto, GuessResult } from "../../types/api";
import { connect, isConnected, subscribe, onConnect, offConnect, publish } from "../../ws/stompClient";
import { StompSubscription } from "@stomp/stompjs";
import GuessInput from "./GuessInput";
import WordleBoard from "./WordleBoard";
import GameChatPanel from "./GameChatPanel";

type GameState = GameDto & { challengedUserId?: number | null };

const initials = (name: string) => name.slice(0, 2).toUpperCase();

const Avatar: React.FC<{ username: string; size?: number; highlight?: boolean }> = ({
  username, size = 52, highlight = false,
}) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: highlight ? "var(--accent-dim)" : "var(--bg-elevated)",
    border: `2px solid ${highlight ? "var(--accent)" : "var(--border-strong)"}`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-mono)", fontWeight: 700,
    fontSize: size * 0.3,
    color: highlight ? "var(--accent)" : "var(--text-muted)",
    flexShrink: 0,
  }}>
    {initials(username)}
  </div>
);

const GamePage: React.FC = () => {
  const { gameId: gameIdParam } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [game, setGame] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isForfeiting, setIsForfeiting] = useState(false);
  const [incomingChallenge, setIncomingChallenge] = useState<ChallengeDto | null>(null);
  const [isRematching, setIsRematching] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchGameId, setRematchGameId] = useState<number | null>(null);
  const [playerOneUsername, setPlayerOneUsername] = useState<string>("");
  const [playerTwoUsername, setPlayerTwoUsername] = useState<string>(location.state?.opponentName || "");
  const [opponentLeft, setOpponentLeft] = useState(false);
  const gameSubRef = useRef<StompSubscription | null>(null);
  const presenceSubRef = useRef<StompSubscription | null>(null);
  const challengeSubRef = useRef<StompSubscription | null>(null);

  const gameId = useMemo(() => {
    const p = Number(gameIdParam);
    return Number.isFinite(p) ? p : null;
  }, [gameIdParam]);

  const stompReadyRef = useRef(false);
  const [stompReady, setStompReady] = useState(isConnected());

  useEffect(() => {
    if (!token) return;
    const onReady = () => {
      if (stompReadyRef.current) return;
      stompReadyRef.current = true;
      setStompReady(true);
    };
    onConnect(onReady);
    if (!isConnected()) connect(token);
    return () => {
      offConnect(onReady);
      stompReadyRef.current = false;
    };
  }, [token]);

  // ── STOMP: subscribe to game topic ──────────────────────────────────────────
  useEffect(() => {
    if (!stompReady || !gameId) return;
    let sub: StompSubscription | null = null;
    try {
      sub = subscribe(`/topic/game/${gameId}`, (msg) => {
        try {
          const updated = JSON.parse(msg.body) as GameState;
          setGame(updated);
        } catch { }
      });
    } catch { }
    return () => { sub?.unsubscribe(); sub = null; };
  }, [stompReady, gameId]);

  useEffect(() => {
    if (!stompReady || !gameId) return;
    let sub: StompSubscription | null = null;

    try {
      sub = subscribe(`/topic/game/${gameId}/presence`, (msg) => {
        try {
          const data = JSON.parse(msg.body);
          if (data.userId !== user?.id) {
            setOpponentLeft(data.status === "LEFT");
          }
        } catch { }
      });
    } catch { }

    return () => {
      sub?.unsubscribe();
      sub = null;
    };
  }, [stompReady, gameId, user?.id]);

  // ── STOMP: subscribe to user challenge queue ─────────────────────────────────
  useEffect(() => {
    if (!stompReady) return;

    challengeSubRef.current?.unsubscribe();
    challengeSubRef.current = null;

    challengeSubRef.current = subscribe("/user/queue/challenges", (msg) => {
      try {
        const data = JSON.parse(msg.body);
        if (data.status === "DECLINED") {
          setRematchRequested(false);
          setRematchGameId(null);
          navigate("/lobby");
          return;
        }
        setIncomingChallenge(data as ChallengeDto);
      } catch { }
    });

    return () => {
      challengeSubRef.current?.unsubscribe();
      challengeSubRef.current = null;
    };
  }, [stompReady, navigate]);

  // ── REST: load game ──────────────────────────────────────────────────────────
  const loadGame = useCallback(async (showSpinner = false) => {
    if (gameId === null) { setErrorMessage("Invalid game id."); setIsLoading(false); return null; }
    if (showSpinner) setIsLoading(true);
    try {
      const g = await gameApi.getGame(gameId) as GameState;
      setGame(g); setErrorMessage(null); return g;
    } catch (err: any) {
      setErrorMessage(err?.message ?? "Failed to load game");
      return null;
    } finally {
      if (showSpinner) setIsLoading(false);
    }
  }, [gameId]);

  useEffect(() => { void loadGame(true); }, [loadGame]);

  // ── Polling — always on while game is active ─────────────────────────────────
  const { game: polled, error: pollErr } = useGamePolling(
    gameId,
    game?.status === "IN_PROGRESS" || game?.status === "WAITING_FOR_PLAYER"
  );
  useEffect(() => { if (polled) setGame(polled as GameState); }, [polled]);
  useEffect(() => { if (pollErr) setErrorMessage(pollErr); }, [pollErr]);

  // ── Reset rematch state when game changes ────────────────────────────────────
  useEffect(() => {
    setIncomingChallenge(null);
    setRematchRequested(false);
    setRematchGameId(null);
    setOpponentLeft(false);
  }, [gameId]);

  // ── Resolve player usernames ─────────────────────────────────────────────────
  useEffect(() => {
    if (game?.playerOneId && !playerOneUsername) {
      userApi.getUserById(game.playerOneId)
        .then(u => setPlayerOneUsername(u.username))
        .catch(() => setPlayerOneUsername("player 1"));
    }
  }, [game?.playerOneId]);

  useEffect(() => {
    const targetId = game?.playerTwoId ?? game?.challengedUserId;
    if (targetId && !playerTwoUsername) {
      userApi.getUserById(targetId)
        .then(u => setPlayerTwoUsername(u.username))
        .catch(() => setPlayerTwoUsername("player 2"));
    }
  }, [game?.playerTwoId, game?.challengedUserId]);

  // ── Poll rematch game until accepted or declined ─────────────────────────────
  useEffect(() => {
    if (!rematchGameId) return;
    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const g = await gameApi.getGame(rematchGameId);
        if (!active) return;
        if (g.status === "IN_PROGRESS") navigate(`/games/${rematchGameId}`);
        if (g.status === "DECLINED") {
          setRematchRequested(false);
          setRematchGameId(null);
          navigate("/lobby");
        }
      } catch { }
    }, 2000);
    return () => { active = false; window.clearInterval(interval); };
  }, [rematchGameId, navigate]);

  // ── Derived state ────────────────────────────────────────────────────────────
  const isInProgress = game?.status === "IN_PROGRESS";
  const isPending = game?.status === "WAITING_FOR_PLAYER";
  const isDeclined = game?.status === "DECLINED";
  const isCompleted = game?.status === "COMPLETED";
  const canAccept = Boolean(game && user && isPending && game.playerTwoId === null && game.playerOneId !== user.id);
  const isMyTurn = Boolean(isInProgress && game?.currentTurnPlayerId === user?.id);
  const myGuesses = game?.guesses.filter(g => g.playerId === user?.id) ?? [];
  const nextAttempt = (myGuesses[myGuesses.length - 1]?.attemptNumber ?? 0) + 1;
  const opponentId = game
    ? game.playerOneId === user?.id ? (game.playerTwoId ?? game.challengedUserId) : game.playerOneId
    : null;
  const myUsername = user?.username ?? "";
  const opponentUsername = game?.playerOneId === user?.id ? playerTwoUsername : playerOneUsername;
  const iWon = game?.winnerId === user?.id;
  const theyWon = game?.winnerId != null && game?.winnerId !== user?.id;
  const winnerLabel = game?.winnerId == null ? "it's a draw" : iWon ? "you won!" : "you lost";
  const winnerColor = game?.winnerId == null ? "var(--text-muted)" : iWon ? "var(--accent)" : "var(--red)";
  const solution = game?.answer?.toUpperCase() ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleAccept = async () => {
    if (!gameId) return;
    setIsAccepting(true);
    try { await gameApi.acceptGame(gameId); await loadGame(); }
    catch (err) { setErrorMessage(isApiError(err) ? err.message : "Failed to accept"); }
    finally { setIsAccepting(false); }
  };

  const handleForfeit = async () => {
    if (!gameId) return;
    if (!window.confirm("Forfeit? Your opponent will win.")) return;
    setIsForfeiting(true);
    try { await gameApi.forfeitGame(gameId); await loadGame(); }
    catch (err) { setErrorMessage(isApiError(err) ? err.message : "Failed to forfeit"); }
    finally { setIsForfeiting(false); }
  };

  const handleRematch = async () => {
    if (!opponentId) return;
    setIsRematching(true);
    try {
      const newGame = await lobbyApi.challengeUser(opponentId);
      setRematchGameId(newGame.id);
      setRematchRequested(true);
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to send rematch");
    } finally { setIsRematching(false); }
  };

  const handleAcceptRematch = async () => {
    if (!incomingChallenge) return;
    try {
      const newGame = await gameApi.acceptGame(incomingChallenge.gameId);
      navigate(`/games/${newGame.id}`);
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to accept rematch");
      setIncomingChallenge(null);
    }
  };

  const handleDeclineRematch = async () => {
    if (!incomingChallenge) return;
    try {
      await gameApi.declineGame(incomingChallenge.gameId);
      navigate("/lobby");
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to decline rematch");
      setIncomingChallenge(null);
    }
  };

  const handleGuessSubmitted = async (guess: GuessDto, result: GuessResult) => {
    setGame(cur => {
      if (!cur) return cur;
      const otherId = guess.playerId === cur.playerOneId ? cur.playerTwoId : cur.playerOneId;
      return {
        ...cur,
        guesses: [...cur.guesses, guess],
        currentTurnPlayerId: result.correct ? null : otherId,
        status: result.correct ? "COMPLETED" : cur.status,
        winnerId: result.correct ? guess.playerId : cur.winnerId,
      };
    });
    await loadGame();
  };

  const handleLeaveGame = () => {
    if (gameId) {
      publish(`/app/game/${gameId}/leave`, {});
    }
    navigate("/lobby");
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  if (isLoading) return <Spinner />;
  if (!game) return (
    <div className="game-shell">
      <div className="game-main" style={{ padding: 20 }}>
        <div className="banner-error">{errorMessage ?? "Game not found"}</div>
      </div>
    </div>
  );

  // Waiting / declined screen (challenger side)
  if ((isPending || isDeclined) && game.playerOneId === user?.id) {
    const opponentLabel = playerTwoUsername || "the opponent";
    return (
      <div className="game-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: "100%", maxWidth: 480, padding: "60px 40px",
          background: "var(--bg-panel)", border: "1px solid var(--border-strong)",
          borderRadius: 16, textAlign: "center",
        }}>
          {isDeclined ? (
            <>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✕</div>
              <h2 style={{ fontSize: 24, marginBottom: 12, color: "var(--text)" }}>challenge declined</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
                <span style={{ color: "var(--accent)" }}>{opponentLabel}</span> declined your challenge.
              </p>
              <button className="btn btn-primary" style={{ width: "100%" }} onClick={handleLeaveGame}>
                back to lobby
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 22, marginBottom: 10, color: "var(--text)" }}>waiting for response</h2>
              <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
                challenging <strong style={{ color: "var(--text)" }}>{opponentLabel}</strong>...
              </p>
              <Spinner />
              <button className="btn btn-ghost" style={{ marginTop: 24, opacity: 0.7 }} onClick={handleLeaveGame}>
                cancel
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="game-shell" style={{ position: "relative" }}>

      {/* ── Game over modal ── */}
      {isCompleted && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(0,0,0,0.82)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: "var(--bg-panel)", border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-lg)", padding: "36px 40px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 24, minWidth: 340,
          }}>
            {/* Players */}
            <div style={{ display: "flex", alignItems: "center", gap: 20, width: "100%" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <Avatar username={myUsername} size={56} highlight={iWon} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: iWon ? "var(--accent)" : "var(--text-muted)", fontWeight: iWon ? 700 : 400 }}>{myUsername}</span>
                {iWon && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, background: "var(--accent-dim)", color: "var(--accent)", border: "1px solid var(--accent-border)", padding: "2px 8px", borderRadius: 20 }}>winner</span>}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color: winnerColor }}>{winnerLabel}</div>
                {solution && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                    word: <span style={{ color: "var(--accent)", fontWeight: 700, letterSpacing: "0.12em" }}>{solution}</span>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                <Avatar username={opponentUsername || "?"} size={56} highlight={theyWon} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: theyWon ? "var(--red)" : "var(--text-muted)", fontWeight: theyWon ? 700 : 400 }}>{opponentUsername || "opponent"}</span>
                {theyWon && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 8px", borderRadius: 20 }}>winner</span>}
              </div>
            </div>

            <div style={{ width: "100%", height: 1, background: "var(--border)" }} />

            {/* Rematch */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: rematchRequested ? "var(--accent)" : "var(--border-strong)", transition: "background 0.3s" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" }}>{rematchRequested ? "ready" : "waiting"}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>rematch?</span>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: incomingChallenge
                      ? "var(--accent)"
                      : opponentLeft
                        ? "var(--red)"
                        : "var(--border-strong)",
                    transition: "background 0.3s"
                  }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)" }}>
                    {incomingChallenge ? "ready" : opponentLeft ? "left" : "waiting"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                {incomingChallenge ? (
                  <>
                    <button className="btn btn-primary" onClick={handleAcceptRematch}>accept rematch</button>
                    <button className="btn btn-ghost" style={{ color: "var(--red)", borderColor: "rgba(239,68,68,0.3)" }} onClick={handleDeclineRematch}>decline</button>
                  </>
                ) : rematchRequested ? (
                  <>
                    <button className="btn btn-ghost" onClick={handleLeaveGame}>back to lobby</button>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                      {opponentLeft ? "opponent left the game" : "waiting for opponent..."}
                    </span>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={handleLeaveGame}>back to lobby</button>
                    {opponentId && !opponentLeft && (
                      <button className="btn btn-ghost" onClick={handleRematch} disabled={isRematching}>
                        {isRematching ? "..." : "rematch"}
                      </button>
                    )}
                    {opponentLeft && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                        opponent left the game
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Game main ── */}
      <div className="game-main">
        <div className="game-header">
          <span className="game-title">game #{game.id}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isInProgress && (
              <>
                <span className={`game-status ${opponentLeft ? "status-waiting" : "status-progress"}`}>
                  {opponentLeft
                    ? "opponent left the game"
                    : isMyTurn ? "your turn" : "opponent's turn"}
                </span>
                <button className="btn btn-danger" style={{ fontSize: 11 }} onClick={handleForfeit} disabled={isForfeiting}>
                  {isForfeiting ? "..." : "forfeit"}
                </button>
              </>
            )}
            {isPending && <span className="game-status status-waiting">waiting for opponent</span>}
            {isCompleted && (
              <>
                <span className="game-status status-completed">{winnerLabel}</span>
                <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={handleLeaveGame}>back to lobby</button>
              </>
            )}
            {canAccept && (
              <button className="btn btn-amber" onClick={handleAccept} disabled={isAccepting}>
                {isAccepting ? "accepting..." : "accept challenge"}
              </button>
            )}
          </div>
        </div>

        <div className="game-board-area">
          {errorMessage && <div className="banner-error" style={{ width: "100%", maxWidth: 340 }}>{errorMessage}</div>}
          <div className="board-section">
            <div className="board-section-label">your guesses</div>
            <WordleBoard guesses={game.guesses} currentUserId={user?.id ?? -1} />
          </div>
          {isInProgress && user && (
            <div style={{ width: "100%", maxWidth: 340 }}>
              <GuessInput
                gameId={game.id}
                currentUserId={user.id}
                nextAttemptNumber={nextAttempt}
                disabled={!isMyTurn}
                disabledMessage={isMyTurn ? null : "waiting for opponent's move..."}
                onGuessSubmitted={handleGuessSubmitted}
              />
            </div>
          )}
        </div>
      </div>

      {gameIdParam && stompReady && <GameChatPanel gameId={gameIdParam} />}
    </div>
  );
};

export default GamePage;
