package edu.rit.backend.user.service;

import edu.rit.backend.user.repo.UserRepository;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class UserStatsServiceTest {

    @Test
    void recordWinCallsWinnerWinAndLoserLoss() {
        UserRepository repo = mock(UserRepository.class);
        UserStatsService service = new UserStatsService(repo);

        Long winnerId = 1L;
        Long loserId = 2L;

        service.recordWin(winnerId, loserId);

        verify(repo).incrementWin(winnerId);
        verify(repo).incrementLoss(loserId);
        verifyNoMoreInteractions(repo);
    }

    @Test
    void recordDrawCallsBothDraw() {
        UserRepository repo = mock(UserRepository.class);
        UserStatsService service = new UserStatsService(repo);

        Long a = 1L;
        Long b = 2L;

        service.recordDraw(a, b);

        verify(repo).incrementDraw(a);
        verify(repo).incrementDraw(b);
        verifyNoMoreInteractions(repo);
    }

    @Test
    void recordForfeitCallsForfeiterForfeitAndOtherWin() {
        UserRepository repo = mock(UserRepository.class);
        UserStatsService service = new UserStatsService(repo);

        Long forfeiterId = 1L;
        Long otherId = 2L;

        service.recordForfeit(forfeiterId, otherId);

        verify(repo).incrementForfeit(forfeiterId);
        verify(repo).incrementWin(otherId);
        verifyNoMoreInteractions(repo);
    }
}

