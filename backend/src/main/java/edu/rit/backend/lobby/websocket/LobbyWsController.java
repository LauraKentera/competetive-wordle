package edu.rit.backend.lobby.websocket;

import edu.rit.backend.lobby.dto.LobbyChatMessage;
import edu.rit.backend.lobby.service.LobbyService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.Instant;

@Controller
public class LobbyWsController {

    private final LobbyService lobbyService;

    public LobbyWsController(LobbyService lobbyService) {
        this.lobbyService = lobbyService;
    }

    @MessageMapping("/lobby/chat.send")
    @SendTo("/topic/lobby/chat")
    public LobbyChatMessage sendMessage(LobbyChatMessage message, Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Not authenticated");
        }
        LobbyChatMessage withSender = new LobbyChatMessage(
                principal.getName(),
                message != null && message.content() != null ? message.content() : "",
                message != null && message.timestamp() != null ? message.timestamp() : Instant.now()
        );
        return lobbyService.processChatMessage(withSender);
    }
}