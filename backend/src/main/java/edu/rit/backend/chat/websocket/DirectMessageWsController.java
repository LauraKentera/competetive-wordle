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

    @MessageMapping("/dm/{roomId}/send")
    public void sendDm(@DestinationVariable Long roomId,
                       @Payload GameChatSendRequest request,
                       Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Not authenticated");
        }
        Long userId = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
        String username = principal.getName();

        if (!directMessageService.isMember(roomId, userId)) {
            throw new IllegalArgumentException("Not a member of this room");
        }

        String content = request != null && request.content() != null ? request.content() : "";
        ChatMessageDto dto = chatService.sendMessage(roomId, userId, username, content);
        messagingTemplate.convertAndSend("/topic/dm/" + roomId, dto);
    }
}
