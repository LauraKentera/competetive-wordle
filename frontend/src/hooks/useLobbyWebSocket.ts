import { useEffect } from "react";
import { IMessage } from "@stomp/stompjs";
import { useAuth } from "../auth/AuthContext";
import { connect, subscribe, publish, onConnect, offConnect } from "../ws/stompClient";
import { LobbyPlayerDto, ChatMessageDto, ChallengeDto } from "../types/api";

interface UseLobbyWebSocketCallbacks {
  onPlayersUpdate?: (players: LobbyPlayerDto[]) => void;
  onLobbyChatMessage?: (message: ChatMessageDto) => void;
  onChallengeReceived?: (challenge: ChallengeDto) => void;
}

export function useLobbyWebSocket(callbacks: UseLobbyWebSocketCallbacks) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;

    const subscriptions: { unsubscribe: () => void }[] = [];

    const doSub = () => {
      subscriptions.forEach(s => s.unsubscribe());
      subscriptions.length = 0;

      const playersSub = subscribe("/topic/lobby/players", (msg: IMessage) => {
        if (callbacks.onPlayersUpdate)
          callbacks.onPlayersUpdate(JSON.parse(msg.body) as LobbyPlayerDto[]);
      });
      const chatSub = subscribe("/topic/lobby/chat", (msg: IMessage) => {
        if (callbacks.onLobbyChatMessage)
          callbacks.onLobbyChatMessage(JSON.parse(msg.body) as ChatMessageDto);
      });
      const challengeSub = subscribe("/user/queue/challenges", (msg: IMessage) => {
        if (callbacks.onChallengeReceived)
          callbacks.onChallengeReceived(JSON.parse(msg.body) as ChallengeDto);
      });

      if (playersSub) subscriptions.push(playersSub);
      if (chatSub) subscriptions.push(chatSub);
      if (challengeSub) subscriptions.push(challengeSub);
    };

    onConnect(doSub);
    connect(token);

    return () => {
      offConnect(doSub);
      subscriptions.forEach(s => s.unsubscribe());
      subscriptions.length = 0;
    };
  }, [token]);

  return {
    sendLobbyChat: (content: string) => {
      publish("/app/lobby/chat.send", { content });
    },
  };
}