import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { userApi } from "../../api/userApi";
import { getFriends, getPendingRequests, sendFriendRequest, removeFriend } from "../../api/friendApi";
import { isApiError } from "../../api/httpClient";
import Spinner from "../../components/ui/Spinner";
import Avatar from "../../components/ui/Avatar";
import AvatarPicker from "../../components/ui/AvatarPicker";
import FriendsPanel from "../lobby/FriendsPanel";
import { useAuth } from "../../auth";
import { connect, disconnect, subscribe, onConnect, offConnect } from "../../ws/stompClient";
import { FriendshipDto, UserResponse } from "../../types/api";
import { getOrCreateDmRoom } from "../../api/dmApi";
import DirectChatPanel from "../chat/DirectChatPanel";
import { ChatMessageDto } from "../../types/api";

import { UserStatus } from "../../types/domain";

type FriendStatus = "none" | "pending" | "friends";

const statusLabel = (status: UserStatus): string => {
  switch (status) {
    case "ONLINE":
      return "online";
    case "IN_GAME":
      return "in game";
    case "OFFLINE":
    default:
      return "offline";
  }
};

const ProfilePage: React.FC = () => {
  const { user: currentUser, updateUser, token } = useAuth();
  const { userId } = useParams();

  const [activeDm, setActiveDm] = useState<{ roomId: number; initialMessages: ChatMessageDto[] } | null>(null);
  const [openingDm, setOpeningDm] = useState(false);

  const parsedUserId = useMemo(() => {
    const n = Number(userId);
    return Number.isFinite(n) ? n : null;
  }, [userId]);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendAction, setFriendAction] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);

  const [friends, setFriends] = useState<UserResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipDto[]>([]);

  const isMe = Boolean(currentUser && parsedUserId !== null && currentUser.id === parsedUserId);

  const refreshFriendData = useCallback(() => {
    getFriends().then(setFriends).catch(() => { });
    getPendingRequests().then(setPendingRequests).catch(() => { });
  }, []);

  useEffect(() => {
    if (!token || !isMe) return;

    const subs: { unsubscribe: () => void }[] = [];

    const doSub = () => {
      subs.forEach(s => s.unsubscribe());
      subs.length = 0;
      try {
        const sub = subscribe("/user/queue/friend-requests", () => refreshFriendData());
        subs.push(sub);
      } catch { }
    };

    onConnect(doSub);
    connect(token);

    return () => {
      offConnect(doSub);
      subs.forEach(s => s.unsubscribe());
      subs.length = 0;
      disconnect();
    };
  }, [token, isMe, refreshFriendData]);

  useEffect(() => {
    const load = async () => {
      if (parsedUserId === null) {
        setErrorMessage("Invalid user id.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (isMe) {
          const [u, fr, pending] = await Promise.all([
            userApi.getUserById(parsedUserId),
            getFriends(),
            getPendingRequests(),
          ]);
          setUser(u);
          setFriends(fr);
          setPendingRequests(pending);
        } else {
          const [u, friendsList] = await Promise.all([
            userApi.getUserById(parsedUserId),
            getFriends(),
          ]);
          setUser(u);
          const match = friendsList.find((f) => f.id === parsedUserId);
          if (match) setFriendStatus("friends");
        }
      } catch (err) {
        setUser(null);
        setErrorMessage(isApiError(err) ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [parsedUserId, isMe]);

  const winRate = useMemo(() => {
    const played = user?.gamesPlayed ?? 0;
    const won = user?.gamesWon ?? 0;
    if (played <= 0) return "0.0%";
    return `${((won / played) * 100).toFixed(1)}%`;
  }, [user?.gamesPlayed, user?.gamesWon]);

  const handleAvatarSelect = async (avatarId: 1 | 2 | 3) => {
    if (!isMe || !user) return;
    if ((user.avatarId ?? 1) === avatarId) return;

    setAvatarError(null);
    setIsSavingAvatar(true);

    try {
      const updated = await userApi.updateAvatar(avatarId);
      setUser(updated);
      updateUser(updated);
    } catch (err) {
      setAvatarError(isApiError(err) ? err.message : "Failed to update avatar");
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!parsedUserId) return;
    setFriendAction(true);
    setFriendError(null);
    try {
      await sendFriendRequest(parsedUserId);
      setFriendStatus("pending");
    } catch (err) {
      setFriendError(isApiError(err) ? err.message : "Failed to send friend request");
    } finally {
      setFriendAction(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!parsedUserId) return;
    setFriendAction(true);
    setFriendError(null);
    try {
      await removeFriend(parsedUserId);
      setFriendStatus("none");
    } catch (err) {
      setFriendError(isApiError(err) ? err.message : "Failed to remove friend");
    } finally {
      setFriendAction(false);
    }
  };

  const handleRequestHandled = (friendshipId: number) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  const handleFriendsRefresh = async () => {
    try {
      const fr = await getFriends();
      setFriends(fr);
    } catch { }
  };

  const handleOpenDm = async () => {
    if (!parsedUserId) return;
    setOpeningDm(true);
    try {
      const dm = await getOrCreateDmRoom(parsedUserId);
      setActiveDm({ roomId: dm.roomId, initialMessages: dm.messages });
    } catch (err) {
      console.error("DM error:", err);  // 👈 add this
    } finally {
      setOpeningDm(false);
    }
  };

  if (isLoading) return <Spinner />;

  if (errorMessage || !user) {
    return (
      <div className="profile-shell">
        <div className="profile-card">
          <div className="banner-error">{errorMessage ?? "User not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-shell">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-header-left">
            <Avatar avatarId={user.avatarId ?? 1} size="lg" username={user.username} />
            <div className="profile-title">
              <div className="profile-username">{user.username}</div>
              <span className={`profile-status profile-status-${(user.status ?? "OFFLINE").toLowerCase()}`}>
                {statusLabel(user.status)}
              </span>
            </div>
          </div>

          {!isMe && (
            <div className="profile-friend-actions">
              {friendStatus === "none" && (
                <button
                  className="btn btn-primary"
                  onClick={handleSendFriendRequest}
                  disabled={friendAction}
                >
                  {friendAction ? "..." : "Send Friend Request"}
                </button>
              )}
              {friendStatus === "pending" && (
                <button className="btn btn-outline" disabled>
                  Request Sent
                </button>
              )}
              {friendStatus === "friends" && (
                <>
                  <span className="profile-friends-check">Friends ✓</span>
                  <button
                    className="btn btn-ghost"
                    onClick={handleOpenDm}
                    disabled={openingDm}
                  >
                    {openingDm ? "..." : "Message"}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleRemoveFriend}
                    disabled={friendAction}
                  >
                    {friendAction ? "..." : "Remove Friend"}
                  </button>
                </>
              )}
              {friendError && (
                <div className="banner-error" style={{ marginTop: 8 }}>
                  {friendError}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-grid">
          <div className="profile-panel">
            <div className="panel-header">
              <span>stats</span>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat">
                <div className="profile-stat-label">games played</div>
                <div className="profile-stat-value">{user.gamesPlayed}</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">games won</div>
                <div className="profile-stat-value">{user.gamesWon}</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">games lost</div>
                <div className="profile-stat-value">{user.gamesLost}</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">games drawn</div>
                <div className="profile-stat-value">{user.gamesDrawn}</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">games forfeited</div>
                <div className="profile-stat-value">{user.gamesForfeited}</div>
              </div>
              <div className="profile-stat">
                <div className="profile-stat-label">win rate</div>
                <div className="profile-stat-value">{winRate}</div>
              </div>
            </div>
          </div>

          {isMe && (
            <div className="profile-panel">
              <div className="panel-header">
                <span>avatar</span>
              </div>
              <div className="profile-panel-body">
                <div className="profile-avatar-edit">
                  <AvatarPicker
                    currentAvatarId={(user.avatarId ?? 1) as 1 | 2 | 3}
                    onSelect={handleAvatarSelect}
                  />
                </div>

                {isSavingAvatar && (
                  <div className="profile-saving-text">Saving avatar...</div>
                )}

                {avatarError && (
                  <div className="banner-error" style={{ marginTop: 10 }}>
                    {avatarError}
                  </div>
                )}
              </div>
            </div>
          )}

          {isMe && (
            <div style={{ gridColumn: "1 / -1" }}>
              <FriendsPanel
                friends={friends}
                pendingRequests={pendingRequests}
                onRequestHandled={handleRequestHandled}
                onFriendsRefresh={handleFriendsRefresh}
                panelClassName="profile-panel"
              />
            </div>
          )}
        </div>
      </div>
      {activeDm && user && (
        <DirectChatPanel
          roomId={activeDm.roomId}
          friendUsername={user.username}
          initialMessages={activeDm.initialMessages}
          onClose={() => setActiveDm(null)}
        />
      )}
    </div>
  );
};

export default ProfilePage;
