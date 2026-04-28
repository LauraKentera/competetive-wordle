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

/**
 * Data access layer for {@link User} entities.
 *
 * <p>Extends Spring Data JPA with lookup queries and bulk stat-update operations.
 * The {@code increment*} methods issue a single {@code UPDATE} statement so that
 * concurrent game results do not require a full entity fetch-and-save cycle.
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /** Finds a user by their unique username, used during authentication. */
    Optional<User> findByUsername(String username);

    /** Returns {@code true} if the username is already registered. */
    boolean existsByUsername(String username);

    /** Returns all users with the given presence status. */
    List<User> findByStatus(UserStatus status);

    /** Returns all users whose presence status is one of the provided values. */
    List<User> findByStatusIn(List<UserStatus> statuses);

    /** Updates the presence status of a single user without loading the entity. */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.status = :status WHERE u.id = :id")
    void updateStatus(@Param("id") Long id, @Param("status") UserStatus status);

    /** Increments {@code gamesPlayed} and {@code gamesWon} for the given user. */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesWon = u.gamesWon + 1 WHERE u.id = :id")
    int incrementWin(@Param("id") Long id);

    /** Increments {@code gamesPlayed} and {@code gamesLost} for the given user. */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesLost = u.gamesLost + 1 WHERE u.id = :id")
    int incrementLoss(@Param("id") Long id);

    /** Increments {@code gamesPlayed} and {@code gamesDrawn} for the given user. */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesDrawn = u.gamesDrawn + 1 WHERE u.id = :id")
    int incrementDraw(@Param("id") Long id);

    /**
     * Increments {@code gamesPlayed}, {@code gamesLost}, and {@code gamesForfeited}
     * for the forfeiting user.
     */
    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.gamesPlayed = u.gamesPlayed + 1, u.gamesLost = u.gamesLost + 1, u.gamesForfeited = u.gamesForfeited + 1 WHERE u.id = :id")
    int incrementForfeit(@Param("id") Long id);
}
