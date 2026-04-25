import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { userApi } from "../../api/userApi";
import { isApiError } from "../../api/httpClient";
import Spinner from "../../components/ui/Spinner";
import Avatar from "../../components/ui/Avatar";
import AvatarPicker from "../../components/ui/AvatarPicker";
import { useAuth } from "../../auth";
import { UserResponse } from "../../types/api";
import { UserStatus } from "../../types/domain";

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
  const { user: currentUser, updateUser } = useAuth();
  const { userId } = useParams();

  const parsedUserId = useMemo(() => {
    const n = Number(userId);
    return Number.isFinite(n) ? n : null;
  }, [userId]);

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSavingAvatar, setIsSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const isMe = Boolean(currentUser && parsedUserId !== null && currentUser.id === parsedUserId);

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
        const u = await userApi.getUserById(parsedUserId);
        setUser(u);
      } catch (err) {
        setUser(null);
        setErrorMessage(isApiError(err) ? err.message : "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [parsedUserId]);

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
                  <Avatar avatarId={user.avatarId ?? 1} size="lg" username={user.username} />
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
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
