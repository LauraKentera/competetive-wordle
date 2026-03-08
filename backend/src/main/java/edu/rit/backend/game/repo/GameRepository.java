package edu.rit.backend.game.repo;

import edu.rit.backend.game.model.Game;
import edu.rit.backend.game.model.GameStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {

    List<Game> findByPlayerOneIdOrPlayerTwoId(Long playerOneId, Long playerTwoId);

    List<Game> findByStatus(GameStatus status);
}
