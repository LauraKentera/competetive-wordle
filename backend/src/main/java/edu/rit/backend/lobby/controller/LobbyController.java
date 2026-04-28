package edu.rit.backend.lobby.controller;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.lobby.dto.ChallengeDto;
import edu.rit.backend.lobby.dto.LobbyPlayerDto;
import edu.rit.backend.lobby.service.LobbyService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for lobby-related operations.
 * Provides endpoints for retrieving online players, lobby chat history, pending challenges,
 * and sending game challenges to other players.
 * Base path: /api/lobby
 */
@RestController
@RequestMapping("/api/lobby")
public class LobbyController {

    private final LobbyService lobbyService;
    private final UserRepository userRepository;

    /**
     * Constructs a LobbyController with the required service and repository dependencies.
     *
     * @param lobbyService   service handling lobby business logic
     * @param userRepository repository for user data access
     */
    public LobbyController(LobbyService lobbyService, UserRepository userRepository) {
        this.lobbyService = lobbyService;
        this.userRepository = userRepository;
    }

    /**
     * Resolves the ID of the currently authenticated user from the provided Authentication object.
     *
     * @param auth the Spring Security authentication object
     * @return the ID of the authenticated user
     * @throws IllegalStateException    if the user is not authenticated
     * @throws IllegalArgumentException if the authenticated user cannot be found in the database
     */
    private Long currentUserId(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Not authenticated");
        }
        return userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    /**
     * Returns the list of all currently online players in the lobby.
     * GET /api/lobby/players
     *
     * @return a list of LobbyPlayerDto objects representing online users
     */
    @GetMapping("/players")
    public List<LobbyPlayerDto> getOnlinePlayers() {
        return lobbyService.getOnlinePlayers();
    }

    /**
     * Returns recent lobby chat messages for the authenticated user.
     * GET /api/lobby/chat
     *
     * @param limit the maximum number of messages to return (defaults to 50)
     * @param auth  the Spring Security authentication object
     * @return a list of ChatMessageDto objects representing recent lobby messages
     * @throws IllegalStateException if the user is not authenticated
     */
    @GetMapping("/chat")
    public List<ChatMessageDto> getLobbyChat(@RequestParam(defaultValue = "50") int limit, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            throw new IllegalStateException("Not authenticated");
        }
        return lobbyService.getRecentLobbyChat(limit);
    }

    /**
     * Returns all pending game challenges received by the authenticated user.
     * GET /api/lobby/challenges
     *
     * @param auth the Spring Security authentication object
     * @return a list of ChallengeDto objects representing incoming pending challenges
     */
    @GetMapping("/challenges")
    public List<ChallengeDto> getMyChallenges(Authentication auth) {
        Long userId = currentUserId(auth);
        return lobbyService.getPendingChallengesFor(userId);
    }

    /**
     * Sends a game challenge from the authenticated user to the specified user.
     * POST /api/lobby/challenge/{userId}
     *
     * @param userId the ID of the user to challenge
     * @param auth   the Spring Security authentication object
     * @return a GameDto representing the newly created challenge game
     */
    @PostMapping("/challenge/{userId}")
    public GameDto challenge(@PathVariable Long userId, Authentication auth) {
        Long challengerId = currentUserId(auth);
        return lobbyService.createChallenge(challengerId, userId);
    }
}
