package edu.rit.backend.lobby.websocket;

import edu.rit.backend.lobby.dto.LobbyChatMessage;
import edu.rit.backend.lobby.service.LobbyService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class LobbyWsController {

    private final LobbyService lobbyService;

    public LobbyWsController(LobbyService lobbyService) {
        this.lobbyService = lobbyService;
    }

    @MessageMapping("/lobby/chat.send")
    @SendTo("/topic/lobby/chat")
    public LobbyChatMessage sendMessage(LobbyChatMessage message) {
        return lobbyService.processChatMessage(message);
    }
}