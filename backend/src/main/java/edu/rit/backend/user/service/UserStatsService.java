package edu.rit.backend.user.service;

import edu.rit.backend.user.repo.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserStatsService {

    private final UserRepository userRepository;

    public UserStatsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void recordWin(Long winnerId, Long loserId) {
        userRepository.incrementWin(winnerId);
        userRepository.incrementLoss(loserId);
    }

    public void recordDraw(Long playerAId, Long playerBId) {
        userRepository.incrementDraw(playerAId);
        userRepository.incrementDraw(playerBId);
    }

    public void recordForfeit(Long forfeiterId, Long otherPlayerId) {
        userRepository.incrementForfeit(forfeiterId);
        userRepository.incrementWin(otherPlayerId);
    }
}

