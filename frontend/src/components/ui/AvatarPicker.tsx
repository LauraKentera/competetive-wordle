import React from "react";
import Avatar from "./Avatar";

interface AvatarPickerProps {
  currentAvatarId: 1 | 2 | 3;
  onSelect: (id: 1 | 2 | 3) => void;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatarId,
  onSelect,
}) => {
  const avatars: (1 | 2 | 3)[] = [1, 2, 3];

  return (
    <div className="avatar-picker">
      {avatars.map((id) => (
        <button
          key={id}
          type="button"
          className={
            currentAvatarId === id
              ? "avatar-picker-option selected"
              : "avatar-picker-option"
          }
          onClick={() => onSelect(id)}
        >
          <Avatar avatarId={id} size="lg" />
        </button>
      ))}
    </div>
  );
};

export default AvatarPicker;