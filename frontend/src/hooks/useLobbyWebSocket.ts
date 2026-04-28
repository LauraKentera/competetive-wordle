import { useEffect } from "react";
import { IMessage } from "@stomp/stompjs";
import { useAuth } from "../auth/AuthContext";
import { connect, subscribe, publish, onConnect, offConnect } from "../ws/stompClient";
import { LobbyPlayerDto, ChatMessageDto, ChallengeDto } from "../types/api";

/**
 * Callbacks supplied by the consumer of `useLobbyWebSocket`.
 * All three are optional — only provide the ones the component cares about.
 */
interface UseLobbyWebSocketCallbacks {
  /**
   * Called whenever the server broadcasts an updated list of online players.
   * Fires on every player connect, disconnect, or status change (ONLINE <-> IN_GAME).
   * Replaces the entire player list — do not merge with previous state.
   */
  onPlayersUpdate?: (players: LobbyPlayerDto[]) => void;

  /**
   * Called when a new lobby chat message arrives on `/topic/lobby/chat`.
   * Append the message to local chat state rather than replacing it.
   */
  onLobbyChatMessage?: (message: ChatMessageDto) => void;

  /**
   * Called when the current user receives an incoming challenge on
   * `/user/queue/challenges`. Also fires when a challenge the user sent
   * is declined by the recipient — check `ChallengeDto` fields to distinguish.
   */
  onChallengeReceived?: (challenge: ChallengeDto) => void;
  onFriendUpdate?: () => void;
}

/**
 * Hook that manages the lobby's WebSocket subscriptions for the lifetime of the
 * component that mounts it.
 *
 * Responsibilities:
 * - Calls `connect()` with the current JWT when the hook mounts.
 * - Subscribes to `/topic/lobby/players`, `/topic/lobby/chat`, and
 *   `/user/queue/challenges` as soon as the STOMP connection is established.
 * - Re-subscribes automatically if the connection drops and reconnects
 *   (via the `onConnect` callback mechanism in `stompClient`).
 * - Cleans up all subscriptions and removes the `onConnect` listener on unmount.
 *
 * @param callbacks - Object of optional event handlers (see `UseLobbyWebSocketCallbacks`).
 * @returns An object containing `sendLobbyChat`, a function to publish a message
 *          to the lobby chat topic.
 *
 * @example
 * const { sendLobbyChat } = useLobbyWebSocket({
 *   onPlayersUpdate: (players) => setPlayers(players),
 *   onLobbyChatMessage: (msg) => setMessages(prev => [...prev, msg]),
 *   onChallengeReceived: (challenge) => setChallenges(prev => [...prev, challenge]),
 * });
 */
export function useLobbyWebSocket(callbacks: UseLobbyWebSocketCallbacks) {
  const { token } = useAuth();

  useEffect(() => {
    // Do nothing if the user is not authenticated yet.
    if (!token) return;

    /**
     * Tracks active STOMP subscriptions so they can all be torn down
     * together when the component unmounts or the connection drops.
     */
    const subscriptions: { unsubscribe: () => void }[] = [];

    /**
     * Creates (or recreates) all three lobby subscriptions.
     * This is registered as an `onConnect` callback so it runs both on the
     * initial connection and on any reconnection after a dropped link.
     * Before subscribing, any stale subscriptions from a previous session
     * are unsubscribed to prevent duplicate message delivery.
     */
    const doSub = () => {
      // Tear down any subscriptions left over from a previous connection.
      subscriptions.forEach(s => s.unsubscribe());
      subscriptions.length = 0;

      /**
       * Receives the full, current list of online players whenever any
       * player's presence or status changes.
       * Payload: `LobbyPlayerDto[]`
       */
      const playersSub = subscribe("/topic/lobby/players", (msg: IMessage) => {
        if (callbacks.onPlayersUpdate)
          callbacks.onPlayersUpdate(JSON.parse(msg.body) as LobbyPlayerDto[]);
      });

      /**
       * Receives individual lobby chat messages in real time.
       * Payload: `ChatMessageDto`
       */
      const chatSub = subscribe("/topic/lobby/chat", (msg: IMessage) => {
        if (callbacks.onLobbyChatMessage)
          callbacks.onLobbyChatMessage(JSON.parse(msg.body) as ChatMessageDto);
      });

      /**
       * Receives challenge notifications directed at the current user only
       * (user-scoped destination — other clients do not see these messages).
       * Also used for challenge decline notifications sent back to the challenger.
       * Payload: `ChallengeDto`
       */
      const challengeSub = subscribe("/user/queue/challenges", (msg: IMessage) => {
        if (callbacks.onChallengeReceived)
          callbacks.onChallengeReceived(JSON.parse(msg.body) as ChallengeDto);
      });
      const friendSub = subscribe("/user/queue/friend-requests", () => {
        if (callbacks.onFriendUpdate) callbacks.onFriendUpdate();
      });

      // Only track non-null handles; subscribe() can return undefined if it fails.
      if (playersSub) subscriptions.push(playersSub);
      if (chatSub) subscriptions.push(chatSub);
      if (challengeSub) subscriptions.push(challengeSub);
      if (friendSub) subscriptions.push(friendSub);
    };

    // Register doSub to run as soon as the STOMP connection is ready.
    // If the client is already connected, onConnect fires the callback immediately.
    onConnect(doSub);

    // Increment the stompClient reference count and activate the connection
    // (or no-op if it is already active).
    connect(token);

    return () => {
      // Remove the onConnect listener so doSub is not called after unmount.
      offConnect(doSub);
      // Unsubscribe from all active STOMP subscriptions.
      subscriptions.forEach(s => s.unsubscribe());
      subscriptions.length = 0;
    };
    // Re-run the effect if the JWT changes (e.g. after re-login).
  }, [token]);

  return {
    /**
     * Publishes a chat message to the lobby.
     * The server derives the sender's username from the JWT — the `content`
     * field is the only part the client provides.
     *
     * No-op (with a console warning) if the STOMP client is not connected.
     *
     * @param content - The text body of the chat message.
     */
    sendLobbyChat: (content: string) => {
      publish("/app/lobby/chat.send", { content });
    },
  };
}