import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FriendshipDto, UserResponse } from "../../types/api";
import { acceptFriendRequest, rejectFriendRequest } from "../../api/friendApi";
import Avatar from "../../components/ui/Avatar";

interface Props {
  friends: UserResponse[];
  pendingRequests: FriendshipDto[];
  onRequestHandled: (friendshipId: number) => void;
  onFriendsRefresh: () => void;
  panelClassName?: string;
}

const FriendsPanel: React.FC<Props> = ({
  friends,
  pendingRequests,
  onRequestHandled,
  onFriendsRefresh,
  panelClassName = "lobby-panel",
}) => {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [processingId, setProcessingId] = useState<number | null>(null);

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
            {friends.map((f) => (
              <div key={f.id} className="player-row">
                <Link to={`/profile/${f.id}`} className="player-name player-name-link">
                  <span className={f.status === "ONLINE" ? "online-dot" : "offline-dot"} />
                  <Avatar avatarId={f.avatarId} size="sm" username={f.username} />
                  {f.username}
                </Link>
              </div>
            ))}
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
  );
};

export default FriendsPanel;
