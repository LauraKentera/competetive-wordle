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

@Service
@Transactional
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    public FriendshipDto sendRequest(Long fromUserId, Long toUserId) {
        if (fromUserId.equals(toUserId)) {
            throw new IllegalArgumentException("Cannot send a friend request to yourself");
        }

        boolean alreadyExists =
                friendshipRepository.findByRequesterIdAndAddresseeId(fromUserId, toUserId).isPresent() ||
                friendshipRepository.findByRequesterIdAndAddresseeId(toUserId, fromUserId).isPresent();

        if (alreadyExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Friend request already exists");
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

    public FriendshipDto acceptRequest(Long friendshipId, Long currentUserId) {
        Friendship friendship = findOrThrow(friendshipId);

        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the addressee can accept this request");
        }

        friendship.setStatus(FriendshipStatus.ACCEPTED);
        return toDto(friendshipRepository.save(friendship), currentUserId);
    }

    public FriendshipDto rejectRequest(Long friendshipId, Long currentUserId) {
        Friendship friendship = findOrThrow(friendshipId);

        if (!friendship.getAddressee().getId().equals(currentUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the addressee can reject this request");
        }

        friendship.setStatus(FriendshipStatus.REJECTED);
        return toDto(friendshipRepository.save(friendship), currentUserId);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getFriends(Long userId) {
        return friendshipRepository.findAcceptedFriendships(userId).stream()
                .map(f -> {
                    User friend = f.getRequester().getId().equals(userId) ? f.getAddressee() : f.getRequester();
                    return UserResponse.from(friend);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendshipDto> getPendingRequests(Long userId) {
        return friendshipRepository.findByAddresseeIdAndStatus(userId, FriendshipStatus.PENDING).stream()
                .map(f -> toDto(f, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean areFriends(Long userId1, Long userId2) {
        Optional<Friendship> f = friendshipRepository.findByRequesterIdAndAddresseeId(userId1, userId2);
        if (f.isEmpty()) {
            f = friendshipRepository.findByRequesterIdAndAddresseeId(userId2, userId1);
        }
        return f.map(friendship -> friendship.getStatus() == FriendshipStatus.ACCEPTED).orElse(false);
    }

    public void removeFriend(Long currentUserId, Long otherUserId) {
        Optional<Friendship> friendship = friendshipRepository.findByRequesterIdAndAddresseeId(currentUserId, otherUserId);
        if (friendship.isEmpty()) {
            friendship = friendshipRepository.findByRequesterIdAndAddresseeId(otherUserId, currentUserId);
        }
        friendship.ifPresent(friendshipRepository::delete);
    }

    private Friendship findOrThrow(Long friendshipId) {
        return friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new IllegalArgumentException("Friendship not found"));
    }

    private FriendshipDto toDto(Friendship f, Long currentUserId) {
        User other = f.getRequester().getId().equals(currentUserId) ? f.getAddressee() : f.getRequester();
        return new FriendshipDto(f.getId(), UserResponse.from(other), f.getStatus(), f.getCreatedAt());
    }
}
