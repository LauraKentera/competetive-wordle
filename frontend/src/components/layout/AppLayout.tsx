import React, { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import FriendToast from "../ui/FriendToast";
import { useAuth } from "../../auth";
import { connect, disconnect, subscribe, onConnect, offConnect } from "../../ws/stompClient";

interface ToastEntry {
  id: number;
  message: string;
}

let toastSeq = 0;

const SUBTYPE_MESSAGES: Record<string, string> = {
  NEW_REQUEST:      "you have a new friend request",
  REQUEST_ACCEPTED: "your friend request was accepted",
  REQUEST_REJECTED: "your friend request was declined",
  // FRIEND_REMOVED intentionally absent — triggers silent data refresh only
};

const AppLayout: React.FC = () => {
  const { user, token } = useAuth();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const subsRef = useRef<{ unsubscribe: () => void }[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!token) return;

    const doSub = () => {
      subsRef.current.forEach(s => s.unsubscribe());
      subsRef.current = [];
      try {
        const sub = subscribe("/user/queue/friend-requests", (msg) => {
          const body = JSON.parse(msg.body) as { type: string; subtype?: string };
          const message = body.subtype ? SUBTYPE_MESSAGES[body.subtype] : undefined;
          if (message) setToasts(prev => [...prev, { id: ++toastSeq, message }]);
        });
        subsRef.current.push(sub);
      } catch {}
    };

    onConnect(doSub);
    connect(token);

    return () => {
      offConnect(doSub);
      subsRef.current.forEach(s => s.unsubscribe());
      subsRef.current = [];
      disconnect();
    };
  }, [token]);

  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-main">
        <Outlet />
      </main>

      {user && toasts.length > 0 && (
        <div className="friend-toast-container">
          {toasts.map(t => (
            <FriendToast
              key={t.id}
              message={t.message}
              profileUrl={`/profile/${user.id}`}
              onClose={() => dismiss(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AppLayout;
