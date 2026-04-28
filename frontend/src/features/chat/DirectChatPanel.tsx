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

/**
 * 
 * DirectChatPanel component
 * Displays a private direct-message chat window between the current user
 * and a selected friend.
 * 
 * It shows existing messages passed in from the parent component.
 * Subscribing to live incoming messages through STOMP/WebSocket. 
 * Sending new messages to the backend.
 * Loading older paginated messages
 * Auto-scrolling to the newest message
 */
const DirectChatPanel: React.FC<Props> = ({ roomId, friendUsername, initialMessages, onClose }) => {
  // Current logged-in user, used to determine message ownership/styling
  const { user } = useAuth();
  // Stores all messages currently displayed in the chat
  const [messages, setMessages] = useState<ChatMessageDto[]>(initialMessages);
  // Stores the text currently typed into the message input
  const [content, setContent] = useState("");
  // Tracks pagination page for loading older messages
  const [page, setPage] = useState(0);
  // If the initial fetch returned 50 messages, assume older messages may exist
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  // Prevents duplicate "load older" requests while one is already running
  const [loadingOlder, setLoadingOlder] = useState(false);
  // Tracks whether the STOMP/WebSocket client is ready to subscribe/publish
  const [stompReady, setStompReady] = useState(isConnected());
  // Reference used to automatically scroll to the bottom of the chat
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /**
   * Waits for the STOMP connection to become ready.
   * 
   * If already connected, the panel can subscribe immediately.
   * Otherwise, it registers a callback and removes it when the component unmounts.
   */
  useEffect(() => {
    if (isConnected()) {
      setStompReady(true);
      return;
    }
    const onReady = () => setStompReady(true);
    onConnect(onReady);
    return () => offConnect(onReady);
  }, []);

  /**
   * Subscribes to the direct-message topic for this room.
   * 
   * Incoming WebSocket messages are parsed and appended to the message list.
   * The subscription is cleaned up when the room changes or the panel closes.
   */
  useEffect(() => {
    if (!stompReady) return;
    const dest = `/topic/dm/${roomId}`;
    let sub: StompSubscription | null = null;
    try {
      sub = subscribe(dest, (msg) => {
        try {
          const m = JSON.parse(msg.body) as ChatMessageDto;
          setMessages(prev => [...prev, m]);
        } catch {
          // Ignore malformed WebSocket payloads so the chat UI does not crash
        }
      });
    } catch { 
      // Ignore subscription failures; connection state is handled by stompClient
    }
    return () => { sub?.unsubscribe(); sub = null; };
  }, [stompReady, roomId]);

  /**
   * Keeps the newest message visible whenever the message list changes.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Sends a new direct message through STOMP/WebSocket.
   * 
   * Empty or whitespace-only messages are ignored.
   */
  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    publish(`/app/dm/${roomId}/send`, { content: trimmed });
    setContent("");
  };

  /**
   * Loads the next page of older messages from the REST API.
   * 
   * Older messages are prepended to the existing list so the chat remains
   * in chronological order from oldest to newest.
   */
  const handleLoadOlder = async () => {
    setLoadingOlder(true);
    try {
      const nextPage = page + 1;
      const older = await getDmMessages(roomId, nextPage);
      if (older.length < 50) setHasMore(false);
      setMessages(prev => [...older, ...prev]);
      setPage(nextPage);
    } catch { 
      // Silently ignore failed pagination requests for now
    }
    finally {
      setLoadingOlder(false);
    }
  };
  // Formats message timestamps into short local time, e.g. "14:30"
  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="dm-overlay" onClick={onClose}>
      {/* Prevents clicks inside the panel from closing the modal overlay */}
      <div className="dm-panel" onClick={e => e.stopPropagation()}>
        {/* Chat header with friend name and close button */}
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{friendUsername}</span>
          <button className="btn btn-outline" style={{ padding: "2px 8px", fontSize: 11 }} onClick={onClose}>✕</button>
        </div>

        {/* Message list area */}
        <div className="chat-messages">
          {/* Show pagination control only when older messages may still exist */}
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
          {/* Empty state when no direct messages exist yet */}
          {messages.length === 0 && <div className="panel-empty">no messages yet</div>}
          {/* Render each message with different styling for current user vs friend */}
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
          {/* Invisible anchor used for auto-scrolling to the newest message */}
          <div ref={bottomRef} />
        </div>

        {/* Message input and send button */}
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
