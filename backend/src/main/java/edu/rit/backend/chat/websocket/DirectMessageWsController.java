package edu.rit.backend.chat.websocket;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.chat.dto.GameChatSendRequest;
import edu.rit.backend.chat.service.ChatService;
import edu.rit.backend.chat.service.DirectMessageService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

// WebSocket controller for handling direct message (DM) communication
@Controller
public class DirectMessageWsController {

    private final UserRepository userRepository;
    private final ChatService chatService;
    private final DirectMessageService directMessageService;
    private final SimpMessagingTemplate messagingTemplate;

    public DirectMessageWsController(UserRepository userRepository,
                                     ChatService chatService,
                                     DirectMessageService directMessageService,
                                     SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.chatService = chatService;
        this.directMessageService = directMessageService;
        this.messagingTemplate = messagingTemplate;
    }

    // Handles incoming WebSocket messages sent to /app/dm/{roomId}/send
    @MessageMapping("/dm/{roomId}/send")
    public void sendDm(@DestinationVariable Long roomId,
                       @Payload GameChatSendRequest request,
                       Principal principal) {

        // Ensure the user is authenticated
        if (principal == null) {
            throw new IllegalStateException("Not authenticated");
        }

        // Resolve user ID from authenticated username
        Long userId = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();

        String username = principal.getName();

        // Verify that the user is a member of the DM room
        if (!directMessageService.isMember(roomId, userId)) {
            throw new IllegalArgumentException("Not a member of this room");
        }

        // Extract message content safely from request
        String content = request != null && request.content() != null ? request.content() : "";

        // Persist message and create DTO
        ChatMessageDto dto = chatService.sendMessage(roomId, userId, username, content);

        // Broadcast the message to all subscribers of the room topic
        messagingTemplate.convertAndSend("/topic/dm/" + roomId, dto);
    }
}