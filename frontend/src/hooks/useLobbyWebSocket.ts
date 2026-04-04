import { useEffect } from "react";
import { IMessage } from "@stomp/stompjs";
import { useAuth } from "../auth/AuthContext";
import { connect, disconnect, subscribe, publish, onConnect } from "../ws/stompClient";
import { LobbyPlayerDto, ChatMessageDto } from "../types/api";

interface UseLobbyWebSocketCallbacks {
  onPlayersUpdate?: (players: LobbyPlayerDto[]) => void;
  onLobbyChatMessage?: (message: ChatMessageDto) => void;
}

export function useLobbyWebSocket(callbacks: UseLobbyWebSocketCallbacks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const subscriptions: { unsubscribe: () => void }[] = [];

    onConnect(() => {
      const playersSub = subscribe("/topic/lobby/players", (msg: IMessage) => {
        if (callbacks.onPlayersUpdate) {
          callbacks.onPlayersUpdate(JSON.parse(msg.body) as LobbyPlayerDto[]);
        }
      });

      const chatSub = subscribe("/topic/lobby/chat", (msg: IMessage) => {
        if (callbacks.onLobbyChatMessage) {
          callbacks.onLobbyChatMessage(JSON.parse(msg.body) as ChatMessageDto);
        }
      });

      subscriptions.push(playersSub, chatSub);
    });

    connect(token);

    return () => {
      subscriptions.forEach((s) => s.unsubscribe());
      disconnect();
    };
  }, [token]);

  return {
    sendLobbyChat: (content: string) => {
      publish("/app/lobby/chat.send", { content });
    },
  };
}