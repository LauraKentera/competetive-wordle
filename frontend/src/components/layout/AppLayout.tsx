import React, { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import NavBar from "./NavBar";
import FriendToast from "../ui/FriendToast";
import { useAuth } from "../../auth";
import { connect, disconnect, subscribe, onConnect, offConnect } from "../../ws/stompClient";
import { getPendingRequests } from "../../api/friendApi";

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
  const [unreadDmByUsername, setUnreadDmByUsername] = useState<Record<string, number>>({});
  const [pendingFriendRequestCount, setPendingFriendRequestCount] = useState(0);
  const subsRef = useRef<{ unsubscribe: () => void }[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshPendingFriendRequests = useCallback(async () => {
    try {
      const pending = await getPendingRequests();
      setPendingFriendRequestCount(pending.length);
    } catch {
      // keep current counter if refresh fails
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    void refreshPendingFriendRequests();
  }, [token, refreshPendingFriendRequests]);

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
          void refreshPendingFriendRequests();
        });
        subsRef.current.push(sub);

        const dmSub = subscribe("/user/queue/dm-notifications", (msg) => {
          const body = JSON.parse(msg.body) as { fromUsername?: string };
          const from = body.fromUsername?.trim() || "someone";
          setUnreadDmByUsername(prev => ({
            ...prev,
            [from]: (prev[from] ?? 0) + 1,
          }));
          setToasts(prev => [...prev, { id: ++toastSeq, message: `${from} sent you a message` }]);
        });
        subsRef.current.push(dmSub);
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
  }, [token, refreshPendingFriendRequests]);

  const totalUnreadDm = Object.values(unreadDmByUsername).reduce((sum, n) => sum + n, 0);
  const clearUnreadDmForUsername = useCallback((username: string) => {
    setUnreadDmByUsername(prev => {
      if (!(username in prev)) return prev;
      const next = { ...prev };
      delete next[username];
      return next;
    });
  }, []);

  return (
    <div className="app-shell">
      <NavBar unreadDmCount={totalUnreadDm} pendingFriendRequestCount={pendingFriendRequestCount} />
      <main className="app-main">
        <Outlet context={{ unreadDmByUsername, clearUnreadDmForUsername }} />
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
