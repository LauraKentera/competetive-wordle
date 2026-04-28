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
}

/**
 * 
 * FriendsPanel components
 * 
 * Displays the user's friends and pending friend requests.
 * Responsibilities:
 * Switch between friends list and request list
 * Accept or reject incoming friend requests
 * Open direct message rooms with friends
 * Subscribe to DM rooms for unread message notifications
 */
const FriendsPanel: React.FC<Props> = ({
  friends,
  pendingRequests,
  onRequestHandled,
  onFriendsRefresh,
  panelClassName = "lobby-panel",
}) => {
  // Controls whether the panel displays friends or incoming requests
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  // Tracks the request currently being accepted or rejected
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Tracks which friend's DM room is currently being opened
  const [openingDmId, setOpeningDmId] = useState<number | null>(null);

  // Maps DM room ids to friend ids for unread message tracking
  const roomToFriend = useRef<Map<number, number>>(new Map());

  // Maps friend ids to DM room ids for reconnect/resubscribe logic
  const friendToRoom = useRef<Map<number, number>>(new Map());

  // Stores active STOMP subscriptions by room id so they can be cleaned up
  const subs = useRef<Map<number, StompSubscription>>(new Map());

  // Tracks unread message counts by friend id
  const [unread, setUnread] = useState<Map<number, number>>(new Map());
  // Stores the currently open direct-message chat
  const [activeDm, setActiveDm] = useState<DmState | null>(null);
  // Tracks the active room id without causing rerenders
  const activeDmRoomId = useRef<number | null>(null);
  // Stores whether the STOMP/WebSocket client is currently connected
  const stompReady = useRef(isConnected());

  /**
   * 
   * Subscribes to a direct-message room.
   * 
   * If a message arrives while the room is not actively open, the unread
   * counter for that friend is increased.
   */
  const subscribeToRoom = useCallback((roomId: number, friendId: number) => {
    if (subs.current.has(roomId)) return;
    try {
      const sub = subscribe(`/topic/dm/${roomId}`, () => {
        // Do not count messages as unread if the chat room is currently open
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

  /**
   * Re-subscribes to known DM rooms when STOMP reconnects.
   * 
   * Also cleans up active subscriptions when the component unmounts.
   */
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

  /**
   * 
   * Opens or creates a direct-message room with a friend
   * 
   * The backend returns the room id and message history.
   * The room is then subscribed to for unread message tracking.
   */
  const handleOpenDm = async (friend: UserResponse) => {
    setOpeningDmId(friend.id);
    try {
      const dm = await getOrCreateDmRoom(friend.id);
      const roomId = dm.roomId;

      // Store room/friend relationships for subscriptions and unread tracking
      friendToRoom.current.set(friend.id, roomId);
      roomToFriend.current.set(roomId, friend.id);

      if (isConnected()) {
        subscribeToRoom(roomId, friend.id);
      }

      // Opening a DM clears unread messages for that friend
      setUnread(prev => {
        const next = new Map(prev);
        next.delete(friend.id);
        return next;
      });

      activeDmRoomId.current = roomId;
      setActiveDm({ roomId, friendUsername: friend.username, initialMessages: dm.messages });
    } catch { }
    finally {
      setOpeningDmId(null);
    }
  };

  /**
   * Closes the active direct-message panel.
   */
  const handleCloseDm = () => {
    activeDmRoomId.current = null;
    setActiveDm(null);
  };

  /**
   * Accepts an incoming friend request.
   * 
   * After accepting, the request is removed and the friends list is refreshed.
   */
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

  /**
   * Rejects an incoming friend request.
   * 
   * After rejecting, the request is removed from the pending list.
   */
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
    {/* Header tabs switch between friends and pending requests */}
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
            {/* Empty state when user has no friends */}
              {friends.length === 0 && (
                <div className="panel-empty">no friends yet</div>
              )}
              {/* Friends list with profile links, online status, avatars, and DM button */}
              {friends.map((f) => {
                const badge = unread.get(f.id) ?? 0;
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
                      {/* Unread badge appears when messages arrive while DM is closed */}
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
              {/* Empty state when there are no pending friend requests */}
              {pendingRequests.length === 0 && (
                <div className="panel-empty">no pending requests</div>
              )}
              {/* Incoming friend requests with accept/reject actions */}
              {pendingRequests.filter((f) => f.user != null).map((f) => (
                <div key={f.id} className="challenge-row">
                  <span className="challenge-from">{f.user.username}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {/* Accept request and refresh friends list */}
                    <button
                      className="btn btn-amber"
                      style={{ padding: "4px 10px", fontSize: 11 }}
                      onClick={() => handleAccept(f)}
                      disabled={processingId !== null}
                    >
                      {processingId === f.id ? "..." : "accept"}
                    </button>
                    {/* Reject request and remove it from pending list */}
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
      {/* Direct chat modal shown when a friend conversation is opened */}
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
