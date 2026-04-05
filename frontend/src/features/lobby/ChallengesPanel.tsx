import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChallengeDto } from "../../types/api";
import Button from "../../components/ui/Button";
import ErrorBanner from "../../components/ui/ErrorBanner";
import { gameApi } from "../../api/gameApi";
import { isApiError } from "../../api/httpClient";

interface Props {
  challenges: ChallengeDto[];
}

const ChallengesPanel: React.FC<Props> = ({ challenges }) => {
  const navigate = useNavigate();
  const [challengeList, setChallengeList] = useState<ChallengeDto[]>(challenges);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setChallengeList(challenges);
  }, [challenges]);

  const handleAccept = async (gameId: number) => {
    setErrorMessage(null);
    try {
      const game = await gameApi.acceptGame(gameId);
      navigate(`/games/${game.id}`);
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to accept challenge");
    }
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
      <h2 style={{ margin: 0, fontSize: 18 }}>Challenges</h2>

      {errorMessage && <ErrorBanner message={errorMessage} />}

      {challengeList.length === 0 && (
        <p style={{ margin: 0, color: "var(--color-text-muted)" }}>No pending challenges.</p>
      )}

      {challengeList.map((challenge) => (
        <div
          key={challenge.gameId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--spacing-sm)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius)",
            padding: "var(--spacing-sm)",
          }}
        >
          <span>{challenge.challengerUsername}</span>
          <Button
            onClick={() => handleAccept(challenge.gameId)}
            style={{
              padding: "8px 16px",
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius)",
              fontSize: 14,
              cursor: "pointer",
              opacity: 1,
            }}
          >
            Accept
          </Button>
        </div>
      ))}
    </section>
  );
};

export default ChallengesPanel;
