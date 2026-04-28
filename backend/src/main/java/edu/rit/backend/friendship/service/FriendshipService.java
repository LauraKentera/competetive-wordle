package edu.rit.backend.friendship.service;

import edu.rit.backend.friendship.dto.FriendshipDto;
import edu.rit.backend.friendship.model.Friendship;
import edu.rit.backend.friendship.model.FriendshipStatus;
import edu.rit.backend.friendship.repo.FriendshipRepository;
import edu.rit.backend.user.dto.UserResponse;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;

/**
 * Service class containing the core business logic for managing friendships.
 * All public methods run within a transaction by default.
 */
@Service
@Transactional
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    /**
     * Constructs a FriendshipService with the required repository dependencies.
     *
     * @param friendshipRepository repository for friendship data access
     * @param userRepository       repository for user data access
     */
    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    /**
     * Sends a friend request from one user to another.
     * Validates that a user cannot send a request to themselves, and that no
     * existing friendship or request already exists between the two users.
     *
     * @param fromUserId the ID of the user sending the request
     * @param toUserId   the ID of the user receiving the request
     * @return a FriendshipDto representing the newly created pending request
     * @throws IllegalArgumentException  if the sender and receiver are the same user, or if either user is not found
     * @throws ResponseStatusException   if a friendship or request between the two users already exists (409 Conflict)
     */
    public FriendshipDto sendRequest(Long fromUserId, Long toUserId) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot send a friend request to yourself");
        }

        Optional<Friendship> existing =
                friendshipRepository.findByRequesterIdAndAddresseeId(fromUserId, toUserId)
                        .or(() -> friendshipRepository.findByRequesterIdAndAddresseeId(toUserId, fromUserId));

        if (existing.isPresent()) {
            if (existing.get().getStatus() == FriendshipStatus.REJECTED) {
                friendshipRepository.delete(existing.get());
            } else {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already exists");
            }
        }

        User from = userRepository.findById(fromUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User to = userRepository.findById(toUserId)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found"));

        Friendship friendship = new Friendship();
        friendship.setRequester(from);
        friendship.setAddressee(to);

        friendship = friendshipRepository.save(friendship);
        return toDto(friendship, fromUserId);
    }

    /**
     * Accepts a pending friend request on behalf of the addressee.
     * Only the addressee of the request is permitted to accept it.
     *
     * @param friendshipId  the ID of the friendship request to accept
     * @param currentUserId the ID of the authenticated user performing the action
     * @return a FriendshipDto reflecting the updated ACCEPTED status
     * @throws ResponseStatusException if the current user is not the addressee of the request (403 Forbidden)
     */
    public FriendshipDto acceptRequest(Long friendshipId, Long currentUserId) {
        Friendship friendship = findOrThrow(friendshipId);

        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the addressee can accept this request");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        return toDto(friendshipRepository.save(friendship), currentUserId);
    }

    /**
     * Rejects a pending friend request on behalf of the addressee.
     * Only the addressee of the request is permitted to reject it.
     *
     * @param friendshipId  the ID of the friendship request to reject
     * @param currentUserId the ID of the authenticated user performing the action
     * @return a FriendshipDto reflecting the updated REJECTED status
     * @throws ResponseStatusException if the current user is not the addressee of the request (403 Forbidden)
     */
    public FriendshipDto rejectRequest(Long friendshipId, Long currentUserId) {
        Friendship friendship = findOrThrow(friendshipId);

        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the addressee can reject this request");
        }

        friendship.setStatus(FriendshipStatus.REJECTED);
        return toDto(friendshipRepository.save(friendship), currentUserId);
    }

    /**
     * Retrieves all accepted friends of the given user.
     * Determines the "other" user in each friendship relative to the given userId.
     * Read-only transaction — no database writes occur.
     *
     * @param userId the ID of the user whose friends are to be retrieved
     * @return a list of UserResponse objects representing each friend
     */
    @Transactional(readOnly = true)
    public List<UserResponse> getFriends(Long userId) {
        return friendshipRepository.findAcceptedFriendships(userId).stream()
                .map(f -> {
                    User friend = f.getRequester().getId().equals(userId) ? f.getAddressee() : f.getRequester();
                    return UserResponse.from(friend);
                })
                .toList();
    }

    /**
     * Retrieves all pending incoming friend requests for the given user.
     * Read-only transaction — no database writes occur.
     *
     * @param userId the ID of the user whose pending requests are to be retrieved
     * @return a list of FriendshipDto objects representing each pending request
     */
    @Transactional(readOnly = true)
    public List<FriendshipDto> getPendingRequests(Long userId) {
        return friendshipRepository.findByAddresseeIdAndStatus(userId, FriendshipStatus.PENDING).stream()
                .map(f -> toDto(f, userId))
                .toList();
    }

    /**
     * Checks whether two users have an accepted friendship between them.
     * Searches both directions (either user may have been the original requester).
     * Read-only transaction — no database writes occur.
     *
     * @param userId1 the ID of the first user
     * @param userId2 the ID of the second user
     * @return true if an ACCEPTED friendship exists between the two users, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean areFriends(Long userId1, Long userId2) {
        Optional<Friendship> f = friendshipRepository.findByRequesterIdAndAddresseeId(userId1, userId2);
        if (f.isEmpty()) {
            f = friendshipRepository.findByRequesterIdAndAddresseeId(userId2, userId1);
        }
        return f.map(friendship -> friendship.getStatus() == FriendshipStatus.ACCEPTED).orElse(false);
    }

    /**
     * Removes an existing friendship between the current user and another user.
     * Searches both directions to locate the friendship record, then deletes it.
     * If no friendship is found, the method exits silently without error.
     *
     * @param currentUserId the ID of the authenticated user initiating the removal
     * @param otherUserId   the ID of the friend to be removed
     */
    public Optional<String> removeFriend(Long currentUserId, Long otherUserId) {
        Optional<Friendship> friendship = friendshipRepository.findByRequesterIdAndAddresseeId(currentUserId, otherUserId);
        if (friendship.isEmpty()) {
            friendship = friendshipRepository.findByRequesterIdAndAddresseeId(otherUserId, currentUserId);
        }
        if (friendship.isPresent()) {
            Friendship f = friendship.get();
            User other = f.getRequester().getId().equals(currentUserId) ? f.getAddressee() : f.getRequester();
            String otherUsername = other.getUsername();
            friendshipRepository.delete(f);
            return Optional.of(otherUsername);
        }
        return Optional.empty();
    }

    /**
     * Looks up a Friendship entity by ID, throwing an exception if not found.
     *
     * @param friendshipId the ID of the friendship to look up
     * @return the found Friendship entity
     * @throws IllegalArgumentException if no friendship with the given ID exists
     */
    private Friendship findOrThrow(Long friendshipId) {
        return friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friendship not found"));
    }

    /**
     * Converts a Friendship entity into a FriendshipDto.
     * Determines the "other" user relative to the current user to populate the DTO.
     *
     * @param f             the Friendship entity to convert
     * @param currentUserId the ID of the authenticated user, used to identify the other party
     * @return a FriendshipDto representing the friendship from the current user's perspective
     */
    private FriendshipDto toDto(Friendship f, Long currentUserId) {
        User other = f.getRequester().getId().equals(currentUserId) ? f.getAddressee() : f.getRequester();
        return new FriendshipDto(f.getId(), UserResponse.from(other), f.getStatus(), f.getCreatedAt());
    }
}
