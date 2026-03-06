package edu.rit.backend.game.repo;

import edu.rit.backend.game.model.Game;
import edu.rit.backend.game.model.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByPlayerOneIdOrPlayerTwoId(Long playerOneId, Long playerTwoId);

    List<Game> findByStatus(GameStatus status);

    List<Game> findByStatusAndPlayerTwoIdIsNull(GameStatus status);

    List<Game> findByPlayerOneIdOrPlayerTwoIdAndStatusIn(
            Long playerOneId,
            Long playerTwoId,
            List<GameStatus> statuses);

    Optional<Game> findById(Long id);

    long countByStatus(GameStatus status);
}