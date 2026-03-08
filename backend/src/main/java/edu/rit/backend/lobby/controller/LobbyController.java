package edu.rit.backend.lobby.controller;

import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.lobby.dto.ChallengeDto;
import edu.rit.backend.lobby.dto.LobbyPlayerDto;
import edu.rit.backend.lobby.service.LobbyService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lobby")
public class LobbyController {

    private final LobbyService lobbyService;
    private final UserRepository userRepository;

    public LobbyController(LobbyService lobbyService, UserRepository userRepository) {
        this.lobbyService = lobbyService;
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

    @GetMapping("/players")
    public List<LobbyPlayerDto> getOnlinePlayers() {
        return lobbyService.getOnlinePlayers();
    }

    @GetMapping("/challenges")
    public List<ChallengeDto> getMyChallenges(Authentication auth) {
        Long userId = currentUserId(auth);
        return lobbyService.getPendingChallengesFor(userId);
    }

    @PostMapping("/challenge/{userId}")
    public GameDto challenge(@PathVariable Long userId, Authentication auth) {
        Long challengerId = currentUserId(auth);
        return lobbyService.createChallenge(challengerId, userId);
    }
}
