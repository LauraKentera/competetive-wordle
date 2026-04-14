import React, { useEffect, useState } from "react";
import { isApiError } from "../../api/httpClient";
import { lobbyApi } from "../../api/lobbyApi";
import { useLobbyWebSocket } from "../../hooks/useLobbyWebSocket";
import { ChallengeDto, ChatMessageDto, LobbyPlayerDto } from "../../types/api";
import Spinner from "../../components/ui/Spinner";
import OnlinePlayersPanel from "./OnlinePlayersPanel";
import ChallengesPanel from "./ChallengesPanel";
import LobbyChatPanel from "./LobbyChatPanel";

const LobbyPage: React.FC = () => {
  const [players, setPlayers] = useState<LobbyPlayerDto[]>([]);
  const [challenges, setChallenges] = useState<ChallengeDto[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessageDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [p, c, ch] = await Promise.all([
          lobbyApi.getPlayers(),
          lobbyApi.getChallenges(),
          lobbyApi.getChatHistory(50),
        ]);
        setPlayers(p);
        setChallenges(c);
        setChatHistory(ch);
      } catch (err) {
        setErrorMessage(isApiError(err) ? err.message : "Failed to load lobby");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const c = await lobbyApi.getChallenges();
        setChallenges(c);
      } catch {}
    }, 3000);
    return () => window.clearInterval(interval);
  }, []);

  const { sendLobbyChat } = useLobbyWebSocket({
    onPlayersUpdate: (updated) => setPlayers(updated),
    onLobbyChatMessage: (msg) => setChatHistory((prev) => [...prev, msg]),
    onChallengeReceived: (challenge) => {
      setChallenges((prev) => {
        if (prev.find((c) => c.gameId === challenge.gameId)) return prev;
        return [...prev, challenge];
      });
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="lobby-shell">
      {errorMessage && (
        <div style={{ gridColumn: "1/-1", padding: 12 }}>
          <div className="banner-error">{errorMessage}</div>
        </div>
      )}
      <OnlinePlayersPanel players={players} />
      <ChallengesPanel challenges={challenges} />
      <LobbyChatPanel initialMessages={chatHistory} sendLobbyChat={sendLobbyChat} />
    </div>
  );
};

export default LobbyPage;