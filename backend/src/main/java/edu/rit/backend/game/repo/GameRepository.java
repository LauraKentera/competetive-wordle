package edu.rit.backend.game.repo;

import edu.rit.backend.game.model.Game;
import edu.rit.backend.game.model.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByPlayerOneIdOrPlayerTwoId(Long playerOneId, Long playerTwoId);

    List<Game> findByStatus(GameStatus status);

    List<Game> findByInvitedPlayerIdAndStatus(Long invitedPlayerId, GameStatus status);

    @Query("SELECT g FROM Game g WHERE (g.playerOneId = :userId OR g.playerTwoId = :userId) AND g.status = :status")
    List<Game> findActiveGamesForPlayer(@Param("userId") Long userId, @Param("status") GameStatus status);
}
