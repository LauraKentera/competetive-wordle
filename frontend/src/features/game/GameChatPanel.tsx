import React, { useEffect, useRef, useState } from "react";
import { StompSubscription } from "@stomp/stompjs";
import { useAuth } from "../../auth";
import { gameApi } from "../../api/gameApi";
import { ChatMessageDto } from "../../types/api";
import { publish, subscribe, onConnect, offConnect, isConnected } from "../../ws/stompClient";

interface Props { gameId: string; }

const GameChatPanel: React.FC<Props> = ({ gameId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [stompReady, setStompReady] = useState(isConnected());

  // Load history
  useEffect(() => {
    let mounted = true;
    gameApi.getGameChat(Number(gameId))
      .then(h => { if (mounted) setMessages(h); })
      .catch(() => { });
    return () => { mounted = false; };
  }, [gameId]);

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
    const dest = `/topic/game/${gameId}/chat`;
    let sub: StompSubscription | null = null;
    try {
      sub = subscribe(dest, (msg) => {
        console.log("GAME CHAT MESSAGE RECEIVED:", msg.body); // ← add this
        try {
          const m = JSON.parse(msg.body) as ChatMessageDto;
          setMessages(prev => [...prev, m]);
        } catch { }
      });
      console.log("GAME CHAT SUBSCRIBED to", dest); // ← and this
    } catch (e) {
      console.error("GAME CHAT SUBSCRIBE FAILED:", e); // ← and this
    }
    return () => { sub?.unsubscribe(); sub = null; };
  }, [stompReady, gameId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    publish(`/app/game/${gameId}/chat.send`, { content: trimmed });
    setContent("");
  };

  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="game-sidebar">
      <div className="panel-header"><span>game chat</span></div>
      <div className="chat-messages">
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
        />
        <button className="btn btn-primary" onClick={handleSend} disabled={!content.trim()} style={{ whiteSpace: "nowrap" }}>
          send
        </button>
      </div>
    </div>
  );
};

export default GameChatPanel;
