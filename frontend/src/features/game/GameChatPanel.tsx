import React, { useEffect, useRef, useState } from "react";
import { IMessage, StompSubscription } from "@stomp/stompjs";
import { useAuth } from "../../auth";
import { gameApi } from "../../api/gameApi";
import { ChatMessageDto } from "../../types/api";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { publish, subscribe, onConnect, offConnect, isConnected } from "../../ws/stompClient";

interface GameChatPanelProps {
  gameId: string;
}

const GameChatPanel: React.FC<GameChatPanelProps> = ({ gameId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [content, setContent] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const subscriptionRef = useRef<StompSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadChatHistory = async () => {
      try {
        const history = await gameApi.getGameChat(Number(gameId));
        if (isMounted) {
          setMessages(history);
        }
      } catch (error) {
        console.error("Failed to load game chat history", error);
      }
    };

    const handleMessage = (message: IMessage) => {
      try {
        const chatMessage = JSON.parse(message.body) as ChatMessageDto;
        setMessages((prevMessages) => [...prevMessages, chatMessage]);
      } catch (error) {
        console.error("Failed to parse game chat message", error);
      }
    };

    const subscribeToChat = () => {
      if (!subscriptionRef.current) {
        subscriptionRef.current = subscribe(`/topic/game/${gameId}/chat`, handleMessage);
      }
    };

    loadChatHistory();
    onConnect(subscribeToChat);
    if (isConnected()) {
      subscribeToChat();
    }

    return () => {
      isMounted = false;
      offConnect(subscribeToChat);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [gameId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    publish(`/app/game/${gameId}/chat.send`, { content: trimmed });
    setContent("");
  };

  return (
    <section
      style={{
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius)",
        background: "#f7fbff",
        padding: "var(--spacing-md)",
        display: "grid",
        gap: "var(--spacing-sm)",
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>Game Chat</h2>

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
          gap: "10px",
          alignContent: "start",
        }}
      >
        {messages.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No chat messages yet.</p>
        ) : (
          messages.map((message, index) => {
            const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const isCurrentUser = message.sender === user?.username;

            return (
              <div
                key={`${message.timestamp}-${index}`}
                style={{
                  display: "grid",
                  gap: 4,
                  padding: "0.5rem",
                  borderRadius: 10,
                  background: isCurrentUser ? "rgba(59, 130, 246, 0.08)" : "transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <span style={{ fontWeight: 600, color: isCurrentUser ? "#1d4ed8" : "inherit" }}>
                    {message.sender}
                    {isCurrentUser ? " (You)" : ""}
                  </span>
                  <span style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{timestamp}</span>
                </div>
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{message.content}</p>
              </div>
            );
          })
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--spacing-sm)" }}>
        <Input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Type a message"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend}>Send</Button>
      </div>
    </section>
  );
};

export default GameChatPanel;
