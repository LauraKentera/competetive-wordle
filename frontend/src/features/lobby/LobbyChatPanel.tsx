import React, { useEffect, useRef, useState } from "react";
import { ChatMessageDto } from "../../types/api";
import { useAuth } from "../../auth";

interface Props {
  initialMessages: ChatMessageDto[];
  sendLobbyChat: (content: string) => void;
}

const LobbyChatPanel: React.FC<Props> = ({ initialMessages, sendLobbyChat }) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    sendLobbyChat(trimmed);
    setContent("");
  };

  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="lobby-panel">
      <div className="panel-header"><span>lobby chat</span></div>
      <div className="chat-messages">
        {initialMessages.length === 0 && <div className="panel-empty">no messages yet</div>}
        {initialMessages.map((m, i) => {
          const mine = m.sender === user?.username;
          return (
            <div key={`${m.timestamp}-${i}`} className={`chat-msg ${mine ? "chat-msg-mine" : "chat-msg-other"} fade-in`}>
              <div className="chat-msg-header">
                <span className={`chat-msg-sender ${mine ? "chat-msg-sender-mine" : "chat-msg-sender-other"}`}>
                  {m.sender}
                </span>
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
          onChange={(e) => setContent(e.target.value)}
          placeholder="message..."
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
        />
        <button className="btn btn-primary" onClick={handleSend}>
          send
        </button>
      </div>
    </div>
  );
};

export default LobbyChatPanel;