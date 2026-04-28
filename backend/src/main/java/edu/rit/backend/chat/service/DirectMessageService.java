package edu.rit.backend.chat.service;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.chat.dto.DmRoomDto;
import edu.rit.backend.chat.model.ChatMessage;
import edu.rit.backend.chat.model.ChatRoom;
import edu.rit.backend.chat.model.ChatRoomType;
import edu.rit.backend.chat.repo.ChatMessageRepository;
import edu.rit.backend.chat.repo.ChatRoomRepository;
import edu.rit.backend.friendship.service.FriendshipService;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

// Service handling direct (private) messaging between users
@Service
public class DirectMessageService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private final ChatService chatService;

    public DirectMessageService(ChatRoomRepository chatRoomRepository,
                                ChatMessageRepository chatMessageRepository,
                                UserRepository userRepository,
                                FriendshipService friendshipService,
                                ChatService chatService) {
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.friendshipService = friendshipService;
        this.chatService = chatService;
    }

    // Retrieves an existing DM room between two users or creates one if it doesn't exist
    @Transactional
    public DmRoomDto getOrCreateDmRoom(Long currentUserId, Long targetUserId) {
        // Prevent users from creating a DM with themselves
        if (currentUserId.equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot open DM with yourself");
        }

        // Ensure users are friends before allowing DM communication
        if (!friendshipService.areFriends(currentUserId, targetUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Users are not friends");
        }

        // Find existing DM room or create a new one
        ChatRoom room = chatRoomRepository.findDirectRoomByMemberIds(currentUserId, targetUserId)
                .orElseGet(() -> createDmRoom(currentUserId, targetUserId));

        // Load recent messages for the room
        List<ChatMessageDto> messages = chatService.getRecentMessages(room.getId(), 50);

        return new DmRoomDto(room.getId(), messages);
    }

    // Retrieves paginated messages from a DM room, ensuring the user is a member
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getDmMessages(Long roomId, Long currentUserId, int page) {
        // Fetch room or throw if it doesn't exist
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));

        // Verify that the current user is part of the room
        requireMember(room, currentUserId);

        // Fetch messages in descending order (newest first)
        List<ChatMessage> raw = chatMessageRepository.findByChatRoomIdOrderBySentAtDesc(
                roomId, PageRequest.of(page, 50));

        List<ChatMessageDto> result = new ArrayList<>();

        // Convert entities to DTOs and resolve usernames
        for (ChatMessage m : raw) {
            String username = userRepository.findById(m.getUserId())
                    .map(User::getUsername)
                    .orElse("?");
            result.add(new ChatMessageDto(username, m.getMessage(), m.getSentAt()));
        }

        // Reverse list to return messages in chronological order
        Collections.reverse(result);

        return result;
    }

    // Checks if a user is a member of a given chat room
    @Transactional(readOnly = true)
    public boolean isMember(Long roomId, Long userId) {
        return chatRoomRepository.findById(roomId)
                .map(r -> r.getMembers().stream().anyMatch(m -> m.getId().equals(userId)))
                .orElse(false);
    }

    // Creates a new direct message room between two users
    @Transactional(readOnly = true)
    public List<User> getOtherMembers(Long roomId, Long userId) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        requireMember(room, userId);
        return room.getMembers().stream()
                .filter(member -> !member.getId().equals(userId))
                .collect(Collectors.toList());
    }

    private ChatRoom createDmRoom(Long userId1, Long userId2) {
        // Fetch both users or throw if not found
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Create a new DIRECT type chat room
        ChatRoom room = new ChatRoom(ChatRoomType.DIRECT, null);

        // Add both users as members of the room
        room.getMembers().add(user1);
        room.getMembers().add(user2);

        // Save and return the room
        return chatRoomRepository.save(room);
    }

    // Ensures the user is a member of the room, otherwise throws an error
    private void requireMember(ChatRoom room, Long userId) {
        boolean member = room.getMembers().stream().anyMatch(m -> m.getId().equals(userId));
        if (!member) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this room");
        }
    }
}