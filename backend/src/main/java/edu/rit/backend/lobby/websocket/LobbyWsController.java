package edu.rit.backend.lobby.websocket;

import edu.rit.backend.lobby.dto.LobbyChatMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class LobbyWsController {

    @MessageMapping("/lobby/chat.send")
    @SendTo("/topic/lobby/chat")
    public LobbyChatMessage sendMessage(LobbyChatMessage message) {
        return message;
    }
}