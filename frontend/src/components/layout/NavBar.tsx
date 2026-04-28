import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import Avatar from "../ui/Avatar";

interface Props {
  unreadDmCount?: number;
  pendingFriendRequestCount?: number;
  onProfileClick?: () => void;
}

const NavBar: React.FC<Props> = ({ unreadDmCount = 0, pendingFriendRequestCount = 0, onProfileClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/lobby" className="navbar-brand">⬛ Wordle.gg</Link>

      {user && (
        <div className="navbar-right">
          <Link to={`/profile/${user.id}`} className="navbar-profile-button" onClick={onProfileClick}>
            <Avatar avatarId={user.avatarId ?? 1} size="sm" username={user.username} />
            <span className="navbar-user">{user.username}</span>
            {unreadDmCount > 0 && (
              <span className="navbar-unread-badge">{unreadDmCount > 99 ? "99+" : unreadDmCount}</span>
            )}
            {pendingFriendRequestCount > 0 && (
              <span className="navbar-unread-badge navbar-friend-request-badge">
                {pendingFriendRequestCount > 99 ? "99+" : pendingFriendRequestCount}
              </span>
            )}
          </Link>

          <button className="btn btn-ghost" onClick={handleLogout}>
            logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
