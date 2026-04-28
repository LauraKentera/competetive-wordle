package edu.rit.backend.user.service;

import edu.rit.backend.user.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Records game outcomes as lifetime statistics on each participant's account.
 *
 * <p>All updates are issued as bulk {@code UPDATE} statements via
 * {@link UserRepository} to avoid unnecessary entity loads. The class is
 * marked {@link Transactional} so that both sides of an outcome (e.g. winner
 * and loser) are updated atomically.
 */
@Service
@Transactional
public class UserStatsService {

    private final UserRepository userRepository;

    public UserStatsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Records a decisive game result — increments wins for the winner and losses for the loser.
     *
     * @param winnerId ID of the winning player
     * @param loserId  ID of the losing player
     */
    public void recordWin(Long winnerId, Long loserId) {
        userRepository.incrementWin(winnerId);
        userRepository.incrementLoss(loserId);
    }

    /**
     * Records a drawn game — increments draws for both players.
     *
     * @param playerAId ID of the first player
     * @param playerBId ID of the second player
     */
    public void recordDraw(Long playerAId, Long playerBId) {
        userRepository.incrementDraw(playerAId);
        userRepository.incrementDraw(playerBId);
    }

    /**
     * Records a forfeit — increments forfeits/losses for the forfeiting player
     * and awards a win to the other player.
     *
     * @param forfeiterId   ID of the player who forfeited
     * @param otherPlayerId ID of the opponent who receives the win
     */
    public void recordForfeit(Long forfeiterId, Long otherPlayerId) {
        userRepository.incrementForfeit(forfeiterId);
        userRepository.incrementWin(otherPlayerId);
    }
}

