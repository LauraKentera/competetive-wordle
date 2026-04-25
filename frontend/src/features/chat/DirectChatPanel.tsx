import React, { useEffect, useRef, useState } from "react";
import { StompSubscription } from "@stomp/stompjs";
import { useAuth } from "../../auth";
import { getDmMessages } from "../../api/dmApi";
import { ChatMessageDto } from "../../types/api";
import { publish, subscribe, onConnect, offConnect, isConnected } from "../../ws/stompClient";

interface Props {
  roomId: number;
  friendUsername: string;
  initialMessages: ChatMessageDto[];
  onClose: () => void;
}

const DirectChatPanel: React.FC<Props> = ({ roomId, friendUsername, initialMessages, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageDto[]>(initialMessages);
  const [content, setContent] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [stompReady, setStompReady] = useState(isConnected());
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isConnected()) {
      setStompReady(true);
      return;
    }
    const onReady = () => setStompReady(true);
    onConnect(onReady);
    return () => offConnect(onReady);
  }, []);

  useEffect(() => {
    if (!stompReady) return;
    const dest = `/topic/dm/${roomId}`;
    let sub: StompSubscription | null = null;
    try {
      sub = subscribe(dest, (msg) => {
        try {
          const m = JSON.parse(msg.body) as ChatMessageDto;
          setMessages(prev => [...prev, m]);
        } catch { }
      });
    } catch { }
    return () => { sub?.unsubscribe(); sub = null; };
  }, [stompReady, roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    publish(`/app/dm/${roomId}/send`, { content: trimmed });
    setContent("");
  };

  const handleLoadOlder = async () => {
    setLoadingOlder(true);
    try {
      const nextPage = page + 1;
      const older = await getDmMessages(roomId, nextPage);
      if (older.length < 50) setHasMore(false);
      setMessages(prev => [...older, ...prev]);
      setPage(nextPage);
    } catch { }
    finally {
      setLoadingOlder(false);
    }
  };

  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="dm-overlay" onClick={onClose}>
      <div className="dm-panel" onClick={e => e.stopPropagation()}>
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{friendUsername}</span>
          <button className="btn btn-outline" style={{ padding: "2px 8px", fontSize: 11 }} onClick={onClose}>✕</button>
        </div>

        <div className="chat-messages">
          {hasMore && (
            <div style={{ textAlign: "center", padding: "4px 0" }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: 11, padding: "3px 10px" }}
                onClick={handleLoadOlder}
                disabled={loadingOlder}
              >
                {loadingOlder ? "loading..." : "load older messages"}
              </button>
            </div>
          )}
          {messages.length === 0 && <div className="panel-empty">no messages yet</div>}
          {messages.map((m, i) => {
            const mine = m.sender === user?.username;
            return (
              <div key={`${m.timestamp}-${i}`} className={`chat-msg ${mine ? "chat-msg-mine" : "chat-msg-other"} fade-in`}>
                <div className="chat-msg-header">
                  <span className={`chat-msg-sender ${mine ? "chat-msg-sender-mine" : "chat-msg-sender-other"}`}>{m.sender}</span>
                  <span className="chat-msg-time">{fmt(m.timestamp)}</span>
                </div>
                <div className="chat-msg-content">{m.content}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-row">
          <input
            className="input"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="type a message..."
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={!content.trim()} style={{ whiteSpace: "nowrap" }}>
            send
          </button>
        </div>
      </div>
    </div>
  );
};

export default DirectChatPanel;
