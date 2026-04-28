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

    @Transactional
    public DmRoomDto getOrCreateDmRoom(Long currentUserId, Long targetUserId) {
        if (currentUserId.equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot open DM with yourself");
        }
        if (!friendshipService.areFriends(currentUserId, targetUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Users are not friends");
        }
        ChatRoom room = chatRoomRepository.findDirectRoomByMemberIds(currentUserId, targetUserId)
                .orElseGet(() -> createDmRoom(currentUserId, targetUserId));
        List<ChatMessageDto> messages = chatService.getRecentMessages(room.getId(), 50);
        return new DmRoomDto(room.getId(), messages);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getDmMessages(Long roomId, Long currentUserId, int page) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
        requireMember(room, currentUserId);

        List<ChatMessage> raw = chatMessageRepository.findByChatRoomIdOrderBySentAtDesc(
                roomId, PageRequest.of(page, 50));
        List<ChatMessageDto> result = new ArrayList<>();
        for (ChatMessage m : raw) {
            String username = userRepository.findById(m.getUserId())
                    .map(User::getUsername)
                    .orElse("?");
            result.add(new ChatMessageDto(username, m.getMessage(), m.getSentAt()));
        }
        Collections.reverse(result);
        return result;
    }

    @Transactional(readOnly = true)
    public boolean isMember(Long roomId, Long userId) {
        return chatRoomRepository.findById(roomId)
                .map(r -> r.getMembers().stream().anyMatch(m -> m.getId().equals(userId)))
                .orElse(false);
    }

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
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        ChatRoom room = new ChatRoom(ChatRoomType.DIRECT, null);
        room.getMembers().add(user1);
        room.getMembers().add(user2);
        return chatRoomRepository.save(room);
    }

    private void requireMember(ChatRoom room, Long userId) {
        boolean member = room.getMembers().stream().anyMatch(m -> m.getId().equals(userId));
        if (!member) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this room");
        }
    }
}
