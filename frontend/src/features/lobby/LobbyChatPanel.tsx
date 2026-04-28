import React, { useEffect, useRef, useState } from "react";
import { ChatMessageDto } from "../../types/api";
import { useAuth } from "../../auth";

interface Props {
  initialMessages: ChatMessageDto[];
  sendLobbyChat: (content: string) => void;
}

/**
 * 
 * LobbyChatPanel component
 * 
 * Displays the global lobby chat where all users can send and receive messages.
 * Responsibilities:
 * Render chat messages passed from parent component
 * Allow user to send new messages
 * Auto-scroll to the newest message
 * Style messages differently for the current user vs others
 */
const LobbyChatPanel: React.FC<Props> = ({ initialMessages, sendLobbyChat }) => {
  // Current logged-in user (used to determine message ownership)
  const { user } = useAuth();

  // Stores the current message being typed
  const [content, setContent] = useState("");

  // Reference used to scroll to the newest message
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /**
   * Automatically scrolls to the latest message whenever the message list updates.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [initialMessages]);

  /**
   * 
   * Sends a message to the lobby chat.
   * 
   * Trims whitespace
   * Prevents empty messages
   * Clears input after sending
   */
  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    sendLobbyChat(trimmed);
    setContent("");
  };

  // Formats timestamps into short local time, e.g. "14:30"
  const fmt = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="lobby-panel">
      {/* Panel header */}
      <div className="panel-header"><span>lobby chat</span></div>
      {/* Message list */}
      <div className="chat-messages">
        {initialMessages.length === 0 && <div className="panel-empty">no messages yet</div>}
        {/* Render each message */}
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
        {/* Invisible anchor used for auto-scrolling */}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        {/* Input row for sending new messages */}
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