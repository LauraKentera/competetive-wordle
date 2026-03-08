package edu.rit.backend.lobby.websocket;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.lobby.dto.LobbyChatMessage;
import edu.rit.backend.lobby.service.LobbyService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class LobbyWsController {

    private final LobbyService lobbyService;
    private final UserRepository userRepository;

    public LobbyWsController(LobbyService lobbyService, UserRepository userRepository) {
        this.lobbyService = lobbyService;
        this.userRepository = userRepository;
    }

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