import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChallengeDto } from "../../types/api";
import { gameApi } from "../../api/gameApi";
import { isApiError } from "../../api/httpClient";

interface Props {
  challenges: ChallengeDto[];
}

const ChallengesPanel: React.FC<Props> = ({ challenges }) => {
  const navigate = useNavigate();
  const [list, setList] = useState<ChallengeDto[]>(challenges);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track which specific game is currently processing an action
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    setList(challenges);
  }, [challenges]);

  const handleAccept = async (gameId: number) => {
    setErrorMessage(null);
    setLoadingId(gameId);
    try {
      const game = await gameApi.acceptGame(gameId);
      navigate(`/games/${game.id}`);
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to accept");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDecline = async (gameId: number) => {
    setErrorMessage(null);
    setLoadingId(gameId);
    try {
      await gameApi.declineGame(gameId);
      setList((prev) => prev.filter((c) => c.gameId !== gameId));
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to decline");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="lobby-panel">
      <div className="panel-header">
        <span>challenges</span>
        <span className="panel-count">{list.length}</span>
      </div>
      <div className="panel-body">
        {errorMessage && (
          <div className="banner-error" style={{ marginBottom: 6 }}>
            {errorMessage}
          </div>
        )}
        {list.length === 0 && (
          <div className="panel-empty">no pending challenges</div>
        )}
        {list.map((c) => (
          <div key={c.gameId} className="challenge-row">
            <span className="challenge-from">{c.challengerUsername}</span>
            <div className="challenge-actions" style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn btn-amber"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => handleAccept(c.gameId)}
                disabled={loadingId !== null}
              >
                {loadingId === c.gameId ? "..." : "accept"}
              </button>
              
              <button
                className="btn btn-outline"
                style={{ padding: "4px 10px", fontSize: 11, color: '#ff5555', borderColor: '#ff5555' }}
                onClick={() => handleDecline(c.gameId)}
                disabled={loadingId !== null}
              >
                decline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengesPanel;