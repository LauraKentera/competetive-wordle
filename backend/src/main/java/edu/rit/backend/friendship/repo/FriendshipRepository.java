package edu.rit.backend.friendship.repo;

import edu.rit.backend.friendship.model.Friendship;
import edu.rit.backend.friendship.model.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    List<Friendship> findByAddresseeIdAndStatus(Long addresseeId, FriendshipStatus status);

    List<Friendship> findByRequesterIdOrAddresseeIdAndStatus(Long uid1, Long uid2, FriendshipStatus status);

    @Query("SELECT f FROM Friendship f WHERE (f.requester.id = :userId OR f.addressee.id = :userId) AND f.status = 'ACCEPTED'")
    List<Friendship> findAcceptedFriendships(@Param("userId") Long userId);
}
