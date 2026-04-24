import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth";
import { userApi } from "../../api/userApi";
import { isApiError } from "../../api/httpClient";
import Avatar from "../ui/Avatar";
import AvatarPicker from "../ui/AvatarPicker";

const NavBar: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const [showProfile, setShowProfile] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAvatarSelect = async (avatarId: 1 | 2 | 3) => {
    if (!user || user.avatarId === avatarId) return;

    setAvatarError(null);
    setIsSavingAvatar(true);

    try {
      const updatedUser = await userApi.updateAvatar(avatarId);
      updateUser(updatedUser);
    } catch (err) {
      setAvatarError(
        isApiError(err) ? err.message : "Failed to update avatar"
      );
    } finally {
      setIsSavingAvatar(false);
    }
  };

  return (
    <nav className="navbar">
      <span className="navbar-brand">⬛ Wordle.gg</span>

      {user && (
        <div className="navbar-right">
          <button
            className="navbar-profile-button"
            onClick={() => setShowProfile(true)}
            type="button"
          >
            <Avatar
              avatarId={user.avatarId ?? 1}
              size="sm"
              username={user.username}
            />
            <span className="navbar-user">{user.username}</span>
          </button>

          <button className="btn btn-ghost" onClick={handleLogout}>
            logout
          </button>
        </div>
      )}

      {user && showProfile && (
        <div className="profile-modal-backdrop">
          <div className="profile-modal">
            <div className="profile-modal-header">
              <h2>My Profile</h2>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setShowProfile(false)}
              >
                x
              </button>
            </div>

            <p className="profile-modal-text">Choose your avatar</p>

            <AvatarPicker
              currentAvatarId={(user.avatarId ?? 1) as 1 | 2 | 3}
              onSelect={handleAvatarSelect}
            />

            {isSavingAvatar && (
              <p className="profile-saving-text">Saving avatar...</p>
            )}

            {avatarError && (
              <div className="banner-error" style={{ marginTop: 8 }}>
                {avatarError}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;