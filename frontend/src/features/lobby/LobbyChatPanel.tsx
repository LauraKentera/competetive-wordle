import React, { useEffect, useRef, useState } from "react";
import { ChatMessageDto } from "../../types/api";
import { useLobbyWebSocket } from "../../hooks/useLobbyWebSocket";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { useAuth } from "../../auth";

interface Props {
  initialMessages: ChatMessageDto[];
}

const LobbyChatPanel: React.FC<Props> = ({ initialMessages }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageDto[]>(initialMessages);
  const [content, setContent] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const { sendLobbyChat } = useLobbyWebSocket({
    onLobbyChatMessage: (message) => {
      setMessages((prev) => [...prev, message]);
    },
  });

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }
    sendLobbyChat(trimmed);
    setContent("");
  };

  return (
    <section
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        background: "#f2f8ff",
        padding: "var(--spacing-md)",
        display: "grid",
        gap: "var(--spacing-sm)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>Lobby Chat</h2>

      <div
        ref={messagesContainerRef}
        style={{
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius)",
          padding: "var(--spacing-sm)",
          minHeight: 240,
          maxHeight: 320,
          overflowY: "auto",
          display: "grid",
          gap: "6px",
          alignContent: "start",
        }}
      >
        {messages.length === 0 && (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No messages yet.</p>
        )}

        {messages.map((message, index) => (
          <p key={`${message.timestamp}-${index}`} style={{ margin: 0 }}>
            <strong style={{ color: message.sender === user?.username ? "#ca8a04" : "inherit" }}>
              {message.sender}
              {message.sender === user?.username ? " (You)" : ""}:
            </strong>{" "}
            {message.content}
          </p>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--spacing-sm)" }}>
        <Input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </section>
  );
};

export default LobbyChatPanel;
