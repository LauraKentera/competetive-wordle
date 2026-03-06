package edu.rit.backend.lobby.service;

import edu.rit.backend.lobby.dto.LobbyChatMessage;
import org.springframework.stereotype.Service;

@Service
public class LobbyService {

    public LobbyChatMessage processChatMessage(LobbyChatMessage message) {
        // For now, just return the message. Add business logic here later.
        return message;
    }
}