// package edu.rit.backend.game.repo;

// // import edu.rit.backend.game.model.Guess;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.stereotype.Repository;
// import java.util.List;
// import java.util.Optional;

// @Repository
// public interface GuessRepository extends JpaRepository<Guess, Long> {
    
//     List<Guess> findByGameIdOrderByAttemptNumberAsc(Long gameId);
    

//     List<Guess> findByGameIdAndPlayerId(Long gameId, Long playerId);
    
//     Optional<Guess> findFirstByGameIdOrderByAttemptNumberDesc(Long gameId);
    
//     List<Guess> findByResult(String result);
    
//     long countByGameId(Long gameId);
    
//     boolean existsByGameIdAndPlayerIdAndGuessWord(Long gameId, Long playerId, String guessWord);
    
//     List<Guess> findByGameIdAndAttemptNumberBetween(Long gameId, int start, int end);
// }