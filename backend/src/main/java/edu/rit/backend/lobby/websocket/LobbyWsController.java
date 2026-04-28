package edu.rit.backend.lobby.websocket;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.lobby.dto.LobbyChatMessage;
import edu.rit.backend.lobby.service.LobbyService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket controller for lobby chat messaging.
 * Handles incoming STOMP messages and broadcasts them to all lobby subscribers.
 * Message destination: /app/lobby/chat.send → /topic/lobby/chat
 */
@Controller
public class LobbyWsController {

    private final LobbyService lobbyService;
    private final UserRepository userRepository;

    /**
     * Constructs a LobbyWsController with the required service and repository dependencies.
     *
     * @param lobbyService   service handling lobby business logic
     * @param userRepository repository for user data access
     */
    public LobbyWsController(LobbyService lobbyService, UserRepository userRepository) {
        this.lobbyService = lobbyService;
        this.userRepository = userRepository;
    }

    /**
     * Handles an incoming lobby chat message from an authenticated WebSocket client
     * and broadcasts the persisted message to all subscribers of /topic/lobby/chat.
     * STOMP destination: /app/lobby/chat.send
     *
     * @param message   the incoming chat message payload
     * @param principal the security principal of the connected user
     * @return a ChatMessageDto to be broadcast to /topic/lobby/chat
     * @throws IllegalStateException    if the principal is null (user not authenticated)
     * @throws IllegalArgumentException if the authenticated user cannot be found in the database
     */
    @MessageMapping("/lobby/chat.send")
    @SendTo("/topic/lobby/chat")
    public ChatMessageDto sendMessage(LobbyChatMessage message, Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Not authenticated");
        }
        Long userId = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
        String content = message != null && message.content() != null ? message.content() : "";
        return lobbyService.sendLobbyChatMessage(userId, principal.getName(), content);
    }
}