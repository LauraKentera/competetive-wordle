import { useEffect, useRef } from "react";
import { IMessage } from "@stomp/stompjs";
import { useAuth } from "../auth/AuthContext";
import {
  connect,
  disconnect,
  subscribe,
  publish,
  onConnect,
  offConnect,
  isConnected,
} from "../ws/stompClient";
import { LobbyPlayerDto, ChatMessageDto } from "../types/api";

interface UseLobbyWebSocketCallbacks {
  onPlayersUpdate?: (players: LobbyPlayerDto[]) => void;
  onLobbyChatMessage?: (message: ChatMessageDto) => void;
}

export function useLobbyWebSocket(callbacks: UseLobbyWebSocketCallbacks) {
  const { token } = useAuth();
  const playersUpdateRef = useRef(callbacks.onPlayersUpdate);
  const lobbyChatMessageRef = useRef(callbacks.onLobbyChatMessage);

  useEffect(() => {
    playersUpdateRef.current = callbacks.onPlayersUpdate;
    lobbyChatMessageRef.current = callbacks.onLobbyChatMessage;
  }, [callbacks]);

  useEffect(() => {
    if (!token) return;

    const subscriptions: { unsubscribe: () => void }[] = [];
    let didSubscribe = false;

    const subscribeChannels = () => {
      if (didSubscribe) {
        return;
      }
      didSubscribe = true;

      const playersSub = subscribe("/topic/lobby/players", (msg: IMessage) => {
        if (playersUpdateRef.current) {
          playersUpdateRef.current(JSON.parse(msg.body) as LobbyPlayerDto[]);
        }
      });

      const chatSub = subscribe("/topic/lobby/chat", (msg: IMessage) => {
        if (lobbyChatMessageRef.current) {
          lobbyChatMessageRef.current(JSON.parse(msg.body) as ChatMessageDto);
        }
      });

      subscriptions.push(playersSub, chatSub);
    };

    onConnect(subscribeChannels);

    connect(token);
    if (isConnected()) {
      subscribeChannels();
    }

    return () => {
      offConnect(subscribeChannels);
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
