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

    @MessageMapping("/game/{gameId}/chat.send")
    public void sendGameChat(@DestinationVariable Long gameId,
                            GameChatSendRequest request,
                            Principal principal) {
        if (principal == null) {
            throw new IllegalStateException("Not authenticated");
        }
        Long userId = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
        String username = principal.getName();

        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        if (!userId.equals(game.getPlayerOneId()) && !userId.equals(game.getPlayerTwoId())) {
            throw new IllegalArgumentException("Only players in this game can send messages");
        }

        String content = request != null && request.content() != null ? request.content() : "";
        ChatMessageDto dto = chatService.sendGameMessage(gameId, userId, username, content);
        messagingTemplate.convertAndSend("/topic/game/" + gameId + "/chat", dto);
    }
}
