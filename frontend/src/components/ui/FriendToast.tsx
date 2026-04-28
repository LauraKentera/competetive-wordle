import React, { useEffect } from "react";
import { Link } from "react-router-dom";

interface Props {
  message: string;
  profileUrl: string;
  onClose: () => void;
}

const DISMISS_MS = 6000;

const FriendToast: React.FC<Props> = ({ message, profileUrl, onClose }) => {
  useEffect(() => {
    const t = window.setTimeout(onClose, DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div className="friend-toast">
      <div className="friend-toast-body">
        <span className="friend-toast-dot" />
        <span className="friend-toast-msg">{message}</span>
      </div>
      <div className="friend-toast-actions">
        <Link to={profileUrl} className="friend-toast-link" onClick={onClose}>
          view profile
        </Link>
        <button className="friend-toast-close" onClick={onClose} aria-label="dismiss">
          ✕
        </button>
      </div>
    </div>
  );
};

export default FriendToast;
