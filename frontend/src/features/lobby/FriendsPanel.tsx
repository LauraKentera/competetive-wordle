import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { StompSubscription } from "@stomp/stompjs";
import { FriendshipDto, UserResponse, ChatMessageDto } from "../../types/api";
import { acceptFriendRequest, rejectFriendRequest } from "../../api/friendApi";
import { getOrCreateDmRoom } from "../../api/dmApi";
import { subscribe, onConnect, offConnect, isConnected } from "../../ws/stompClient";
import Avatar from "../../components/ui/Avatar";
import DirectChatPanel from "../chat/DirectChatPanel";

interface DmState {
  roomId: number;
  friendUsername: string;
  initialMessages: ChatMessageDto[];
}

interface Props {
  friends: UserResponse[];
  pendingRequests: FriendshipDto[];
  onRequestHandled: (friendshipId: number) => void;
  onFriendsRefresh: () => void;
  panelClassName?: string;
  unreadByUsername?: Record<string, number>;
  onClearUnreadForUsername?: (username: string) => void;
}

const FriendsPanel: React.FC<Props> = ({
  friends,
  pendingRequests,
  onRequestHandled,
  onFriendsRefresh,
  panelClassName = "lobby-panel",
  unreadByUsername = {},
  onClearUnreadForUsername,
}) => {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [openingDmId, setOpeningDmId] = useState<number | null>(null);

  // roomId -> friendId mapping for subscriptions
  const roomToFriend = useRef<Map<number, number>>(new Map());
  // friendId -> roomId mapping
  const friendToRoom = useRef<Map<number, number>>(new Map());
  // active subscriptions by roomId
  const subs = useRef<Map<number, StompSubscription>>(new Map());

  const [unread, setUnread] = useState<Map<number, number>>(new Map());
  const [activeDm, setActiveDm] = useState<DmState | null>(null);
  const activeDmRoomId = useRef<number | null>(null);
  const stompReady = useRef(isConnected());

  const subscribeToRoom = useCallback((roomId: number, friendId: number) => {
    if (subs.current.has(roomId)) return;
    try {
      const sub = subscribe(`/topic/dm/${roomId}`, () => {
        if (activeDmRoomId.current === roomId) return;
        setUnread(prev => {
          const next = new Map(prev);
          next.set(friendId, (next.get(friendId) ?? 0) + 1);
          return next;
        });
      });
      subs.current.set(roomId, sub);
    } catch { }
  }, []);

  // Re-subscribe when STOMP reconnects
  useEffect(() => {
    const onReady = () => {
      stompReady.current = true;
      friendToRoom.current.forEach((roomId, friendId) => {
        subs.current.delete(roomId);
        subscribeToRoom(roomId, friendId);
      });
    };
    onConnect(onReady);
    return () => {
      offConnect(onReady);
      subs.current.forEach(s => s.unsubscribe());
      subs.current.clear();
    };
  }, [subscribeToRoom]);

  const handleOpenDm = async (friend: UserResponse) => {
    setOpeningDmId(friend.id);
    try {
      const dm = await getOrCreateDmRoom(friend.id);
      const roomId = dm.roomId;

      friendToRoom.current.set(friend.id, roomId);
      roomToFriend.current.set(roomId, friend.id);

      if (isConnected()) {
        subscribeToRoom(roomId, friend.id);
      }

      setUnread(prev => {
        const next = new Map(prev);
        next.delete(friend.id);
        return next;
      });
      onClearUnreadForUsername?.(friend.username);

      activeDmRoomId.current = roomId;
      setActiveDm({ roomId, friendUsername: friend.username, initialMessages: dm.messages });
    } catch { }
    finally {
      setOpeningDmId(null);
    }
  };

  const handleCloseDm = () => {
    activeDmRoomId.current = null;
    setActiveDm(null);
  };

  const handleAccept = async (friendship: FriendshipDto) => {
    setProcessingId(friendship.id);
    try {
      await acceptFriendRequest(friendship.id);
      onRequestHandled(friendship.id);
      onFriendsRefresh();
    } catch {}
    finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (friendship: FriendshipDto) => {
    setProcessingId(friendship.id);
    try {
      await rejectFriendRequest(friendship.id);
      onRequestHandled(friendship.id);
    } catch {}
    finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <div className={panelClassName}>
        <div className="panel-header">
          <div className="friends-tabs">
            <button
              className={`friends-tab${activeTab === "friends" ? " friends-tab-active" : ""}`}
              onClick={() => setActiveTab("friends")}
            >
              friends
              <span className="panel-count" style={{ marginLeft: 4 }}>{friends.length}</span>
            </button>
            <button
              className={`friends-tab${activeTab === "requests" ? " friends-tab-active" : ""}`}
              onClick={() => setActiveTab("requests")}
            >
              requests
              {pendingRequests.length > 0 && (
                <span className="friends-badge">{pendingRequests.length}</span>
              )}
            </button>
          </div>
        </div>

        <div className="panel-body">
          {activeTab === "friends" && (
            <>
              {friends.length === 0 && (
                <div className="panel-empty">no friends yet</div>
              )}
              {friends.map((f) => {
                const localUnread = unread.get(f.id) ?? 0;
                const globalUnread = unreadByUsername[f.username] ?? 0;
                const badge = localUnread + globalUnread;
                return (
                  <div key={f.id} className="player-row">
                    <Link to={`/profile/${f.id}`} className="player-name player-name-link">
                      <span className={f.status === "ONLINE" ? "online-dot" : "offline-dot"} />
                      <Avatar avatarId={f.avatarId} size="sm" username={f.username} />
                      {f.username}
                    </Link>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 8px", fontSize: 10, flexShrink: 0, position: "relative" }}
                      onClick={() => handleOpenDm(f)}
                      disabled={openingDmId === f.id}
                    >
                      {openingDmId === f.id ? "..." : "message"}
                      {badge > 0 && (
                        <span className="friends-badge" style={{ position: "absolute", top: -6, right: -6 }}>
                          {badge}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === "requests" && (
            <>
              {pendingRequests.length === 0 && (
                <div className="panel-empty">no pending requests</div>
              )}
              {pendingRequests.filter((f) => f.user != null).map((f) => (
                <div key={f.id} className="challenge-row">
                  <span className="challenge-from">{f.user.username}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="btn btn-amber"
                      style={{ padding: "4px 10px", fontSize: 11 }}
                      onClick={() => handleAccept(f)}
                      disabled={processingId !== null}
                    >
                      {processingId === f.id ? "..." : "accept"}
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "4px 10px", fontSize: 11, color: "#ff5555", borderColor: "#ff5555" }}
                      onClick={() => handleReject(f)}
                      disabled={processingId !== null}
                    >
                      reject
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {activeDm && (
        <DirectChatPanel
          roomId={activeDm.roomId}
          friendUsername={activeDm.friendUsername}
          initialMessages={activeDm.initialMessages}
          onClose={handleCloseDm}
        />
      )}
    </>
  );
};

export default FriendsPanel;
