package edu.rit.backend.chat.websocket;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.chat.dto.GameChatSendRequest;
import edu.rit.backend.chat.service.ChatService;
import edu.rit.backend.game.model.Game;
import edu.rit.backend.game.repo.GameRepository;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

// WebSocket controller for handling in-game chat communication
@Controller
public class GameChatWsController {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public GameChatWsController(GameRepository gameRepository,
                                UserRepository userRepository,
                                ChatService chatService,
                                SimpMessagingTemplate messagingTemplate) {
        this.gameRepository = gameRepository;
        this.userRepository = userRepository;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    // Handles incoming WebSocket messages sent to /app/game/{gameId}/chat.send
    @MessageMapping("/game/{gameId}/chat.send")
    public void sendGameChat(@DestinationVariable Long gameId,
                            GameChatSendRequest request,
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

        // Fetch the game or throw if it does not exist
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        // Ensure only players in the game can send messages
        if (!userId.equals(game.getPlayerOneId()) && !userId.equals(game.getPlayerTwoId())) {
            throw new IllegalArgumentException("Only players in this game can send messages");
        }

        // Safely extract message content
        String content = request != null && request.content() != null ? request.content() : "";

        // Persist message and create DTO for broadcasting
        ChatMessageDto dto = chatService.sendGameMessage(gameId, userId, username, content);

        // Broadcast the message to all subscribers of the game chat topic
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/chat", dto);
    }
}