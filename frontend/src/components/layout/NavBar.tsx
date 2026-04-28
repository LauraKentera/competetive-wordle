import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import Avatar from "../ui/Avatar";

const NavBar: React.FC = () => {
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
          <Link to={`/profile/${user.id}`} className="navbar-profile-button">
            <Avatar avatarId={user.avatarId ?? 1} size="sm" username={user.username} />
            <span className="navbar-user">{user.username}</span>
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
