package edu.rit.backend.user.repo;

import edu.rit.backend.user.model.User;
import edu.rit.backend.user.model.UserStatus;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findByStatus(UserStatus status);
    List<User> findByStatusIn(List<UserStatus> statuses);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    void updateStatus(@Param("id") Long id, @Param("status") UserStatus status);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesWon = u.gamesWon + 1 WHERE u.id = :id")
    int incrementWin(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesLost = u.gamesLost + 1 WHERE u.id = :id")
    int incrementLoss(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesDrawn = u.gamesDrawn + 1 WHERE u.id = :id")
    int incrementDraw(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesLost = u.gamesLost + 1, u.gamesForfeited = u.gamesForfeited + 1 WHERE u.id = :id")
    int incrementForfeit(@Param("id") Long id);
}
