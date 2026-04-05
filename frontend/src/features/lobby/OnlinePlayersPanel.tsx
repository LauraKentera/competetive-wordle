import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { lobbyApi } from "../../api/lobbyApi";
import { isApiError } from "../../api/httpClient";
import { useLobbyWebSocket } from "../../hooks/useLobbyWebSocket";
import { LobbyPlayerDto } from "../../types/api";
import Button from "../../components/ui/Button";
import ErrorBanner from "../../components/ui/ErrorBanner";
import { useAuth } from "../../auth";

interface Props {
  players: LobbyPlayerDto[];
}

const OnlinePlayersPanel: React.FC<Props> = ({ players }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playerList, setPlayerList] = useState<LobbyPlayerDto[]>(players);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setPlayerList(players);
  }, [players]);

  useLobbyWebSocket({
    onPlayersUpdate: (updatedPlayers) => {
      setPlayerList(updatedPlayers);
    },
  });

  const handleChallenge = async (userId: number) => {
    setErrorMessage(null);
    try {
      const game = await lobbyApi.challengeUser(userId);
      navigate(`/games/${game.id}`);
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to challenge player");
    }
  };

  const sortedPlayers = [...playerList].sort((a, b) => {
    if (a.id === user?.id) return -1;
    if (b.id === user?.id) return 1;
    return 0;
  });

  return (
    <section
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        background: "#f2f8ff",
        padding: "var(--spacing-md)",
        display: "grid",
        gap: "var(--spacing-sm)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>Online Players</h2>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      {sortedPlayers.length === 0 && (
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No online players.</p>
      )}

      {sortedPlayers.map((player) => (
        <div
          key={player.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--spacing-sm)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "var(--spacing-sm)",
          }}
        >
          <span>
            {player.username}
            {user?.id === player.id && (
              <span style={{ marginLeft: 6, color: "var(--color-text-muted)" }}>(You)</span>
            )}
          </span>
          <Button
            onClick={() => handleChallenge(player.id)}
            disabled={user?.id === player.id}
            title={user?.id === player.id ? "You cannot challenge yourself" : undefined}
            style={
              user?.id === player.id
                ? {
                    padding: "8px 16px",
                    background: "#94a3b8",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: 14,
                    cursor: "not-allowed",
                    opacity: 1,
                  }
                : {
                    padding: "8px 16px",
                    background: "#22c55e",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius)",
                    fontSize: 14,
                    cursor: "pointer",
                    opacity: 1,
                  }
            }
          >
            Challenge
          </Button>
        </div>
      ))}
    </section>
  );
};

export default OnlinePlayersPanel;
