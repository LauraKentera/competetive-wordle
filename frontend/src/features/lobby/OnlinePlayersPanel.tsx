import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { lobbyApi } from "../../api/lobbyApi";
import { isApiError } from "../../api/httpClient";
import { LobbyPlayerDto } from "../../types/api";
import { useAuth } from "../../auth";
import Avatar from "../../components/ui/Avatar";

interface Props {
  players: LobbyPlayerDto[];
}

const OnlinePlayersPanel: React.FC<Props> = ({ players }) => {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [challenging, setChallenging] = useState<number | null>(null);
  const navigate = useNavigate();

  const displayList = useMemo(() => {
    let list = [...players];

    // Keep the current user's lobby row in sync with AuthContext (avatar updates
    // are local and may not trigger a server-side /topic/lobby/players refresh).
    if (user) {
      list = list.map((p) =>
        p.id === user.id
          ? { ...p, avatarId: user.avatarId ?? p.avatarId ?? 1, username: user.username }
          : p
      );
    }

    const isMeInList = user && list.some((p) => p.id === user.id);

    if (!isMeInList && user) {
      list.push({
        id: user.id,
        username: user.username,
        status: "ONLINE" as any,
        avatarId: user.avatarId ?? 1,
      });
    }

    return list.sort((a, b) => {
      if (a.id === user?.id) return -1;
      if (b.id === user?.id) return 1;
      return a.username.localeCompare(b.username);
    });
  }, [players, user]);

  const handleChallenge = async (player: LobbyPlayerDto) => {
    const targetId = player.id;

    if (!targetId) {
      console.error("ID is missing from player object", player);
      return;
    }

    setChallenging(targetId);
    setErrorMessage(null);

    try {
      const newGame = await lobbyApi.challengeUser(targetId);
      navigate(`/games/${newGame.id}`, {
        state: { opponentName: player.username },
      });
    } catch (err) {
      console.error("Challenge failed", err);
      setErrorMessage(
        isApiError(err) ? err.message : "Failed to send challenge"
      );
      setChallenging(null);
    }
  };

  return (
    <div className="lobby-panel">
      <div className="panel-header">
        <span>online</span>
        <span className="panel-count">{displayList.length}</span>
      </div>

      <div className="panel-body">
        {errorMessage && (
          <div className="banner-error" style={{ marginBottom: 6 }}>
            {errorMessage}
          </div>
        )}

        {displayList.length === 0 && (
          <div className="panel-empty">no players online</div>
        )}

        {displayList.map((p) => (
          <div key={p.id} className="player-row">
            <Link to={`/profile/${p.id}`} className="player-name player-name-link">
              <span className="online-dot" />
              <Avatar
                avatarId={p.avatarId}
                size="sm"
                username={p.username}
              />
              {p.username}
              {user?.id === p.id && <span className="you-badge">you</span>}
            </Link>

            {user?.id !== p.id && (
              <button
                className="btn btn-primary"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => handleChallenge(p)}
                disabled={challenging === p.id}
              >
                {challenging === p.id ? "..." : "challenge"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlinePlayersPanel;
