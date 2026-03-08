package edu.rit.backend.game.controller;

import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.game.dto.GuessRequest;
import edu.rit.backend.game.dto.GuessResult;
import edu.rit.backend.game.service.GameService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/games")
public class GameController {

    private final GameService gameService;
    private final UserRepository userRepository;

    public GameController(GameService gameService, UserRepository userRepository) {
        this.gameService = gameService;
        this.userRepository = userRepository;
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
}
