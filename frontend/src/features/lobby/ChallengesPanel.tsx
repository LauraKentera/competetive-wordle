import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChallengeDto } from "../../types/api";
import { gameApi } from "../../api/gameApi";
import { isApiError } from "../../api/httpClient";

interface Props {
  challenges: ChallengeDto[];
}

/**
 * ChallengesPanel component
 * 
 * Displays pending game challenges sent to the current user.
 * Responsibilities:
 * Show incoming challenges
 * Allow user to accept or decline a challenge
 * Navigate to the game after accepting
 * Remove declined challenges from the list
 * Display errors if an action fails
 */
const ChallengesPanel: React.FC<Props> = ({ challenges }) => {
  // Used to redirect the user into a game after accepting a challenge
  const navigate = useNavigate();

  // Local copy of challenges so declined items can be removed immediately from the UI
  const [list, setList] = useState<ChallengeDto[]>(challenges);

  // Tracks which specific challenge is currently processing an action
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Track which specific game is currently processing an action
  const [loadingId, setLoadingId] = useState<number | null>(null);

  /**
   * Keeps local challenge list synced with updates from the parent component.
   */
  useEffect(() => {
    setList(challenges);
  }, [challenges]);

  /**
   * Accepts a pending challenge.
   * 
   * If successful, the user is navigated directly to the created game page.
   */
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

  /**
   * Declines a pending challenge.
   * 
   * If successful, the declined challenge is removed from the local list
   * so the UI updates immediately.
   */
  const handleDecline = async (gameId: number) => {
    setErrorMessage(null);
    setLoadingId(gameId);
    try {
      await gameApi.declineGame(gameId);
      // Optimistically remove declined challenge from the panel
      setList((prev) => prev.filter((c) => c.gameId !== gameId));
    } catch (err) {
      setErrorMessage(isApiError(err) ? err.message : "Failed to decline");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="lobby-panel">
      {/* Panel header showing title and number of pending challenges */}
      <div className="panel-header">
        <span>challenges</span>
        <span className="panel-count">{list.length}</span>
      </div>
      <div className="panel-body">
        {/* Display error message if accepting or declining fails */}
        {errorMessage && (
          <div className="banner-error" style={{ marginBottom: 6 }}>
            {errorMessage}
          </div>
        )}
        {/* Empty state when there are no pending challenges */}
        {list.length === 0 && (
          <div className="panel-empty">no pending challenges</div>
        )}
        {/* Render each pending challenge with accept/decline actions */}
        {list.map((c) => (
          <div key={c.gameId} className="challenge-row">
            <span className="challenge-from">{c.challengerUsername}</span>
            <div className="challenge-actions" style={{ display: 'flex', gap: '4px' }}>
              {/* Accept button starts the game and navigates to game page */}
              <button
                className="btn btn-amber"
                style={{ padding: "4px 10px", fontSize: 11 }}
                onClick={() => handleAccept(c.gameId)}
                disabled={loadingId !== null}
              >
                {loadingId === c.gameId ? "..." : "accept"}
              </button>
              {/* Decline button removes the challenge after backend confirmation */}
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