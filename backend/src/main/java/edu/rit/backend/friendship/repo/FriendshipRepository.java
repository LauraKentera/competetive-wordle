package edu.rit.backend.friendship.repo;

import edu.rit.backend.friendship.model.Friendship;
import edu.rit.backend.friendship.model.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for performing CRUD and query operations on Friendship entities.
 * Extends JpaRepository to inherit standard database operations.
 */
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    /**
     * Finds a friendship record by the IDs of the requester and addressee.
     * Useful for checking whether a friendship or request already exists between two users.
     *
     * @param requesterId the ID of the user who sent the request
     * @param addresseeId the ID of the user who received the request
     * @return an Optional containing the matching Friendship, or empty if none exists
     */
    Optional<Friendship> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    /**
     * Finds all friendship records where the given user is the addressee and the status matches.
     * Primarily used to retrieve pending incoming friend requests for a user.
     *
     * @param addresseeId the ID of the user who received the requests
     * @param status      the friendship status to filter by
     * @return a list of matching Friendship records
     */
    List<Friendship> findByAddresseeIdAndStatus(Long addresseeId, FriendshipStatus status);

    /**
     * Finds all friendship records where the given user is either the requester or the addressee,
     * filtered by the given status.
     * Note: due to Spring Data JPA query derivation rules, this binds uid2 to both the
     * addressee ID and the status condition; uid1 matches the requester ID.
     *
     * @param uid1   the ID to match against the requester
     * @param uid2   the ID to match against the addressee
     * @param status the friendship status to filter by
     * @return a list of matching Friendship records
     */
    List<Friendship> findByRequesterIdOrAddresseeIdAndStatus(Long uid1, Long uid2, FriendshipStatus status);

    /**
     * Retrieves all accepted friendships for a given user, regardless of whether
     * the user was the requester or the addressee.
     *
     * @param userId the ID of the user whose accepted friendships are to be fetched
     * @return a list of Friendship records with ACCEPTED status involving the given user
     */
    @Query("SELECT f FROM Friendship f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) AND f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriendships(@Param("userId") Long userId);
}
