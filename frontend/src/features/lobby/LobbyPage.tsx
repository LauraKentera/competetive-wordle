import React, { useEffect, useState } from "react";
import { isApiError } from "../../api/httpClient";
import { lobbyApi } from "../../api/lobbyApi";
import { getFriends } from "../../api/friendApi";
import { useLobbyWebSocket } from "../../hooks/useLobbyWebSocket";
import { ChallengeDto, ChatMessageDto, LobbyPlayerDto, UserResponse } from "../../types/api";
import Spinner from "../../components/ui/Spinner";
import OnlinePlayersPanel from "./OnlinePlayersPanel";
import ChallengesPanel from "./ChallengesPanel";
import LobbyChatPanel from "./LobbyChatPanel";

/**
 * 
 * LobbyPage component
 * 
 * Main lobby screen shown after login.
 * Responsibilities:
 * Load online players, challenges, chat history, and friends
 * Listen for real-time lobby updates through WebSocket
 * Keep pending challenges refreshed
 * Render lobby panels for players, challenges, and chat 
 */
const LobbyPage: React.FC = () => {
  // Stores currently visible lobby players
  const [players, setPlayers] = useState<LobbyPlayerDto[]>([]);

  // Stores pending game challenges for the current user
  const [challenges, setChallenges] = useState<ChallengeDto[]>([]);

  // Stores lobby chat messages
  const [chatHistory, setChatHistory] = useState<ChatMessageDto[]>([]);

  // Stores the current user's friends so the lobby can mark known players
  const [friends, setFriends] = useState<UserResponse[]>([]);

  // Controls the initial loading spinner
  const [isLoading, setIsLoading] = useState(true);

  // Stores loading or API errors shown to the user
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * 
   * Loads all required lobby data when the page first opens.
   * 
   * Promise.all allows the independent API requests to run in parallel,
   * reducing total loading time for the lobby.
   */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [p, c, ch, fr] = await Promise.all([
          lobbyApi.getPlayers(),
          lobbyApi.getChallenges(),
          lobbyApi.getChatHistory(50),
          getFriends(),
        ]);
        setPlayers(p);
        setChallenges(c);
        setChatHistory(ch);
        setFriends(fr);
      } catch (err) {
        setErrorMessage(isApiError(err) ? err.message : "Failed to load lobby");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  /**
   * Periodically refreshes pending challenges.
   * 
   * This acts as a fallback in case a WebSocket challenge event is missed.
   */
  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const c = await lobbyApi.getChallenges();
        setChallenges(c);
      } catch {}
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  /**
   * 
   * Connects to lobby WebSocket events.
   * 
   * The hook updates lobby state in real time:
   * player list changes,
   * new chat messages,
   * incoming challenges,
   * friend status/list updates
   */
  const { sendLobbyChat } = useLobbyWebSocket({
    onPlayersUpdate: (updated) => setPlayers(updated),
    onLobbyChatMessage: (msg) => setChatHistory((prev) => [...prev, msg]),
    onChallengeReceived: (challenge) => {
      setChallenges((prev) => {
        // Prevent duplicate challenge entries if polling and WebSocket both receive it
        if (prev.find((c) => c.gameId === challenge.gameId)) return prev;
        return [...prev, challenge];
      });
    },
    onFriendUpdate: () => getFriends().then(setFriends).catch(() => {}),
  });

  // Show spinner while initial lobby data is loading
  if (isLoading) return <Spinner />;

  return (
    <div className="lobby-shell">
      {errorMessage && (
        <div style={{ gridColumn: "1/-1", padding: 12 }}>
          <div className="banner-error">{errorMessage}</div>
        </div>
      )}
      {/* Shows online users and friend-related actions */}
      <OnlinePlayersPanel players={players} friends={friends} />
      {/* Shows pending game challenges */}
      <ChallengesPanel challenges={challenges} />
      {/* Shows global lobby chat and sends messages through WebSocket */}
      <LobbyChatPanel initialMessages={chatHistory} sendLobbyChat={sendLobbyChat} />
    </div>
  );
};

export default LobbyPage;
