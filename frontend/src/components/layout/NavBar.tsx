import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <span className="navbar-brand">⬛ Wordle.gg</span>
      {user && (
        <div className="navbar-right">
          <span className="navbar-user">{user.username}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
