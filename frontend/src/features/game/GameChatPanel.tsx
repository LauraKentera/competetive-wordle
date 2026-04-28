import React, { useEffect, useRef, useState } from "react";
import { StompSubscription } from "@stomp/stompjs";
import { useAuth } from "../../auth";
import { gameApi } from "../../api/gameApi";
import { ChatMessageDto } from "../../types/api";
import { publish, subscribe, onConnect, offConnect, isConnected } from "../../ws/stompClient";

interface Props { gameId: string; }

/**
 * 
 * GameChatPanel component
 * 
 * Displays the live chat for a specific game room.
 * It handles:
 * Loading previous chat history from the backend
 * Subscribing to live game chat messages through STOMP/WebSocket
 * Sending new chat messages to the current game room
 * Styling messages differently for the current user and other players
 * Auto-scrolling to the newest message
 */
const GameChatPanel: React.FC<Props> = ({ gameId }) => {
  // Current logged-in user, used to determine message ownership/styling
  const { user } = useAuth();
  // Stores all chat messages displayed in the game chat
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  // Stores the current message being typed
  const [content, setContent] = useState("");
  // Reference used to scroll to the newest message
  const bottomRef = useRef<HTMLDivElement | null>(null);
  // Tracks whether STOMP/WebSocket is connected and ready
  const [stompReady, setStompReady] = useState(isConnected());

  /**
   * Loads existing game chat history from the REST API.
   * 
   * The mounted flag prevents state updates if the component unmounts
   * before the request finishes.
   */
  useEffect(() => {
    let mounted = true;
    gameApi.getGameChat(Number(gameId))
      .then(h => { if (mounted) setMessages(h); })
      .catch(() => { 
        // Ignore failed history requests so the live chat UI can still render
      });
    return () => { mounted = false; };
  }, [gameId]);

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
   * 
   * Subscribes to live chat messages for the current game room.
   * 
   * Incoming WebSocket messages are parsed and appended to the chat.
   * The subscription is cleaned up when the game changes or the component unmounts.
   */
  useEffect(() => {
    if (!stompReady) return;
    const dest = `/topic/game/${gameId}/chat`;
    let sub: StompSubscription | null = null;
    try {
      sub = subscribe(dest, (msg) => {
        // Debug log used to confirm incoming game chat messages during development
        console.log("GAME CHAT MESSAGE RECEIVED:", msg.body); 
        try {
          const m = JSON.parse(msg.body) as ChatMessageDto;
          setMessages(prev => [...prev, m]);
        } catch { 
          // Ignore malformed WebSocket payloads so the chat UI does not crash
        }
      });
      // Debug log used to confirm successful topic subscription
      console.log("GAME CHAT SUBSCRIBED to", dest); 
    } catch (e) {
      // Debug log for subscription failures
      console.error("GAME CHAT SUBSCRIBE FAILED:", e); 
    }
    return () => { sub?.unsubscribe(); sub = null; };
  }, [stompReady, gameId]);

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
    publish(`/app/game/${gameId}/chat.send`, { content: trimmed });
    setContent("");
  };

  // Formats message timestamps into short local time, e.g. "14:30"
  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="game-sidebar">
      {/* Game chat header */}
      <div className="panel-header"><span>game chat</span></div>
      {/* Message list area */}
      <div className="chat-messages">
        {/* Empty state when no chat messages exist yet */}
        {messages.length === 0 && <div className="panel-empty">no messages yet</div>}
        {/* Render messages with different styling for current user vs other players */}
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
        {/* Invisible anchor used for auto-scrolling to newest message */}
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
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!content.trim()} style={{ whiteSpace: "nowrap" }}>
          send
        </button>
      </div>
    </div>
  );
};

export default GameChatPanel;
