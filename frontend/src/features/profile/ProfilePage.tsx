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

/** 
 * Converts backend user status values into display-friendly labels.
 */
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

/**
 * 
 * ProfilePage component
 * 
 * Displays a user's profile, stats, avatar, and friend-related actions.
 * Responsibilities:
 * Load profile data based on route user id
 * Show user game statistics
 * Allow the current user to update their avatar
 * Allow friend requests, friend removal, and direct messaging
 * Show the current user's friends and pending friend requests
 * Listen for live friend request updates through WebSocket
 */
const ProfilePage: React.FC = () => {
  // Current authenticated user and auth helpers from context
  const { user: currentUser, updateUser, token } = useAuth();
  // User id from the route
  const { userId } = useParams();

  // Active direct-message room shown when messaging a friend
  const [activeDm, setActiveDm] = useState<{ roomId: number; initialMessages: ChatMessageDto[] } | null>(null);
  // Tracks whether a DM room is currently being opened
  const [openingDm, setOpeningDm] = useState(false);

  /**
   * Parses the route user id into a number.
   * 
   * If the route parameter is invalid, parsedUserId becomes null.
   */
  const parsedUserId = useMemo(() => {
    const n = Number(userId);
    return Number.isFinite(n) ? n : null;
  }, [userId]);

  // Profile user being viewed
  const [user, setUser] = useState<UserResponse | null>(null);
  // Page loading and error state
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Avatar update state
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Friend action state for viewing another user's profile
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendAction, setFriendAction] = useState(false);
  const [friendError, setFriendError] = useState<string | null>(null);

  // Data used by FriendsPanel when viewing own profile
  const [friends, setFriends] = useState<UserResponse[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendshipDto[]>([]);

  // Determines whether the profile belongs to the current logged-in user
  const isMe = Boolean(currentUser && parsedUserId !== null && currentUser.id === parsedUserId);

  /**
   * Refreshes friends and pending friend requests.
   * 
   * Used after accepting/rejecting requests and when WebSocket notifications arrive.
   */
  const refreshFriendData = useCallback(() => {
    getFriends().then(setFriends).catch(() => { });
    getPendingRequests().then(setPendingRequests).catch(() => { });
  }, []);

  /**
   * Subscribes to private friend request updates for the current user's profile.
   * 
   * This keeps the friends panel updated when new requests arrive in real time.
   */
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

  /**
   * Loads profile data.
   * 
   * If viewing own profile, also loads friends and pending requests.
   * If viewing another user's profile, checks whether they are already a friend.
   */
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
          // Determine whether viewed user is already a friend
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

  /**
   * Calculates win rate from profile statistics.
   */
  const winRate = useMemo(() => {
    const played = user?.gamesPlayed ?? 0;
    const won = user?.gamesWon ?? 0;
    if (played <= 0) return "0.0%";
    return `${((won / played) * 100).toFixed(1)}%`;
  }, [user?.gamesPlayed, user?.gamesWon]);

  /**
   * 
   * Updates the current user's avatar.
   * 
   * The returned user is saved both locally and in AuthContext so other
   * parts of the app can immediately reflect the new avatar.
   */
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

  /**
   * Sends a friend request to the viewed user.
   */
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

  /**
   * Removes the viewed user from the current user's friend list.
   */
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

  /**
   * Removes a handled friend request from the pending list.
   */
  const handleRequestHandled = (friendshipId: number) => {
    setPendingRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  /**
   * Refreshes friends after accepting a request.
   */
  const handleFriendsRefresh = async () => {
    try {
      const fr = await getFriends();
      setFriends(fr);
    } catch { }
  };

  /**
   * Opens or creates a direct-message room with the viewed user.
   */
  const handleOpenDm = async () => {
    if (!parsedUserId) return;
    setOpeningDm(true);
    try {
      const dm = await getOrCreateDmRoom(parsedUserId);
      setActiveDm({ roomId: dm.roomId, initialMessages: dm.messages });
    } catch (err) {
      // Log useful for debugging information if DM creation fails
      console.error("DM error:", err); 
    } finally {
      setOpeningDm(false);
    }
  };

  // Show loading spinner while profile data is being fetched
  if (isLoading) return <Spinner />;

  // Error or fallback state when profile cannot be loaded
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
        {/* Profile header showing avatar, username, status, and friend actions */}
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

          {/* Friend and DM actions are only shown when viewing another user's profile */}
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
              {/* Displays friend action errors */}
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

          {/* Avatar picker is only shown on the current user's own profile */}
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

          {/* Friends panel is only shown on the current user's own profile */}
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
      {/* Direct message modal shown when messaging a friend from their profile */}
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
