import React, { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { lobbyApi } from "../../api/lobbyApi";
import { sendFriendRequest } from "../../api/friendApi";
import { isApiError } from "../../api/httpClient";
import { LobbyPlayerDto, UserResponse } from "../../types/api";
import { useAuth } from "../../auth";
import Avatar from "../../components/ui/Avatar";

interface Props {
  players: LobbyPlayerDto[];
  friends: UserResponse[];
}

const OnlinePlayersPanel: React.FC<Props> = ({ players, friends }) => {
  const { user } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [challenging, setChallenging] = useState<number | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());
  const [addingFriend, setAddingFriend] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const friendIds = useMemo(
    () => new Set(friends.map((f) => Number(f.id))),
    [friends]
  );

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
      const aFriend = friendIds.has(a.id);
      const bFriend = friendIds.has(b.id);
      if (aFriend && !bFriend) return -1;
      if (!aFriend && bFriend) return 1;
      return a.username.localeCompare(b.username);
    });
  }, [players, user, friendIds]);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const handleChallenge = async (player: LobbyPlayerDto) => {
    const targetId = player.id;
    if (!targetId) return;

    setChallenging(targetId);
    setErrorMessage(null);

    try {
      const newGame = await lobbyApi.challengeUser(targetId);
      navigate(`/games/${newGame.id}`, {
        state: { opponentName: player.username },
      });
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to send challenge");
      setChallenging(null);
    }
  };

  const handleAddFriend = async (player: LobbyPlayerDto) => {
    setAddingFriend(player.id);
    try {
      await sendFriendRequest(player.id);
      setSentRequests((prev) => new Set(prev).add(player.id));
      showToast("Friend request sent");
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to send friend request");
    } finally {
      setAddingFriend(null);
    }
  };

  return (
    <div className="lobby-panel">
      <div className="panel-header">
        <span>online</span>
        <span className="panel-count">{displayList.length}</span>
      </div>

      <div className="panel-body">
        {toast && (
          <div className="banner-success" style={{ marginBottom: 6 }}>
            {toast}
          </div>
        )}
        {errorMessage && (
          <div className="banner-error" style={{ marginBottom: 6 }}>
            {errorMessage}
          </div>
        )}

        {displayList.length === 0 && (
          <div className="panel-empty">no players online</div>
        )}

        {displayList.map((p) => {
          const isFriend = friendIds.has(Number(p.id));
          const isPending = sentRequests.has(p.id);

          return (
            <div key={p.id} className="player-row">
              <Link to={`/profile/${p.id}`} className="player-name player-name-link">
                <span className="online-dot" />
                <Avatar avatarId={p.avatarId} size="sm" username={p.username} />
                {p.username}
                {user?.id === p.id && <span className="you-badge">you</span>}
                {isFriend && <span className="friend-star">★</span>}
              </Link>

              {user?.id !== p.id && (
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {!isFriend && (
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 8px", fontSize: 10 }}
                      onClick={() => handleAddFriend(p)}
                      disabled={isPending || addingFriend === p.id}
                    >
                      {isPending ? "pending" : addingFriend === p.id ? "..." : "+friend"}
                    </button>
                  )}
                  <button
                    className="btn btn-primary"
                    style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => handleChallenge(p)}
                    disabled={challenging === p.id}
                  >
                    {challenging === p.id ? "..." : "challenge"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnlinePlayersPanel;
