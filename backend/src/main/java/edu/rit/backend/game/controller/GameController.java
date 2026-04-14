package edu.rit.backend.game.controller;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.chat.service.ChatService;
import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.game.dto.GuessRequest;
import edu.rit.backend.game.dto.GuessResult;
import edu.rit.backend.game.model.Game;
import edu.rit.backend.game.repo.GameRepository;
import edu.rit.backend.game.service.GameService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    public GameController(GameService gameService, UserRepository userRepository,
            GameRepository gameRepository, ChatService chatService, SimpMessagingTemplate messagingTemplate) {
        this.gameService = gameService;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    private Long currentUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Not authenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    @PostMapping
    public GameDto createGame(Authentication auth) {
        Long playerOneId = currentUserId(auth);
        return gameService.createGame(playerOneId);
    }

    @PostMapping("/{id}/accept")
    public GameDto acceptGame(@PathVariable Long id, Authentication auth) {
        Long playerTwoId = currentUserId(auth);
        return gameService.acceptGame(id, playerTwoId);
    }

    @GetMapping("/{id}")
    public GameDto getGame(@PathVariable Long id) {
        return gameService.getGame(id);
    }

    @PostMapping("/{id}/guess")
    public GuessResult guess(@PathVariable Long id, @RequestBody GuessRequest request, Authentication auth) {
        Long playerId = currentUserId(auth);
        String word = request != null && request.word() != null ? request.word() : "";
        return gameService.submitGuess(id, playerId, word);
    }

    @PostMapping("/{id}/decline")
    public GameDto declineGame(@PathVariable Long id, Authentication auth) {
        Long playerTwoId = currentUserId(auth);
        return gameService.declineGame(id, playerTwoId);
    }

    @PostMapping("/{id}/forfeit")
    public GameDto forfeitGame(@PathVariable Long id, Authentication auth) {
        Long playerId = currentUserId(auth);
        return gameService.forfeitGame(id, playerId);
    }

    @GetMapping("/{id}/chat")
    public List<ChatMessageDto> getGameChat(@PathVariable Long id,
            @RequestParam(defaultValue = "50") int limit,
            Authentication auth) {
        Long userId = currentUserId(auth);
        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        if (!userId.equals(game.getPlayerOneId()) && !userId.equals(game.getPlayerTwoId())) {
            throw new IllegalArgumentException("Only players in this game can view chat");
        }
        return chatService.getRecentGameMessages(id, limit);
    }

    @MessageMapping("/game/{gameId}/leave")
    public void playerLeft(@DestinationVariable Long gameId, Principal principal) {
        Long userId = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
        messagingTemplate.convertAndSend(
                "/topic/game/" + gameId + "/presence",
                Map.of("userId", userId, "status", "LEFT"));
    }
}
