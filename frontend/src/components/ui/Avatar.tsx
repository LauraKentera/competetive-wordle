import React from "react";

interface AvatarProps {
  avatarId: number;
  size?: "sm" | "md" | "lg";
  username?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  avatarId,
  size = "md",
  username,
}) => {
  const safeAvatarId = [1, 2, 3].includes(avatarId) ? avatarId : 1;

  const sizeClass =
    size === "sm" ? "avatar-sm" : size === "lg" ? "avatar-lg" : "avatar-md";

  return (
    <img
      src={`/avatars/avatar${safeAvatarId}.png`}
      alt={username ? `${username}'s avatar` : "user avatar"}
      className={`avatar ${sizeClass}`}
    />
  );
};

export default Avatar;