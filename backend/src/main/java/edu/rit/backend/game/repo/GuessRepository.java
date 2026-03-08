package edu.rit.backend.game.repo;

import edu.rit.backend.game.model.Guess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GuessRepository extends JpaRepository<Guess, Long> {

    List<Guess> findByGameIdOrderByAttemptNumberAsc(Long gameId);
}
