import React, { useEffect, useState } from "react";
import { isApiError } from "../../api/httpClient";
import { lobbyApi } from "../../api/lobbyApi";
import { ChallengeDto, ChatMessageDto, LobbyPlayerDto } from "../../types/api";
import Spinner from "../../components/ui/Spinner";
import ErrorBanner from "../../components/ui/ErrorBanner";
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
    const loadLobbyData = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [playersData, challengesData, chatData] = await Promise.all([
          lobbyApi.getPlayers(),
          lobbyApi.getChallenges(),
          lobbyApi.getChatHistory(),
        ]);

        setPlayers(playersData);
        setChallenges(challengesData);
        setChatHistory(chatData);
      } catch (err) {
        setErrorMessage(isApiError(err) ? err.message : "Failed to load lobby");
      } finally {
        setIsLoading(false);
      }
    };

    loadLobbyData();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
      {errorMessage && <ErrorBanner message={errorMessage} />}

      <div
        style={{
          display: "grid",
          gap: "var(--spacing-md)",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          alignItems: "start",
        }}
      >
        <OnlinePlayersPanel players={players} />
        <ChallengesPanel challenges={challenges} />
        <LobbyChatPanel initialMessages={chatHistory} />
      </div>
    </div>
  );
};

export default LobbyPage;
