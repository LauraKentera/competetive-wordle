package edu.rit.backend.lobby.service;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.chat.service.ChatService;
import edu.rit.backend.game.dto.GameDto;
import edu.rit.backend.game.model.GameStatus;
import edu.rit.backend.game.repo.GameRepository;
import edu.rit.backend.game.service.GameService;
import edu.rit.backend.lobby.dto.ChallengeDto;
import edu.rit.backend.lobby.dto.LobbyPlayerDto;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.model.UserStatus;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service class containing the core business logic for lobby operations.
 * Handles online player listings, game challenges, and lobby chat messaging.
 */
@Service
public class LobbyService {

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GameService gameService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Constructs a LobbyService with the required repository and service dependencies.
     *
     * @param userRepository   repository for user data access
     * @param gameRepository   repository for game data access
     * @param gameService      service for game creation and management
     * @param chatService      service for chat message persistence and retrieval
     * @param messagingTemplate template for sending WebSocket messages to specific users
     */
    public LobbyService(UserRepository userRepository,
            GameRepository gameRepository,
            GameService gameService,
            ChatService chatService,
            SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.gameService = gameService;
        this.chatService = chatService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Returns a list of all users currently marked as ONLINE.
     *
     * @return a list of LobbyPlayerDto objects representing online users
     */
    @Transactional(readOnly = true)
    public List<LobbyPlayerDto> getOnlinePlayers() {
        return userRepository.findByStatus(UserStatus.ONLINE).stream()
                .map(u -> new LobbyPlayerDto(u.getId(), u.getUsername(), u.getStatus(), u.getAvatarId()))
                .toList();
    }

    /**
     * Returns all pending game challenges received by the specified user.
     *
     * @param userId the ID of the user to check for incoming challenges
     * @return a list of ChallengeDto objects representing games waiting for the user to accept
     */
    @Transactional(readOnly = true)
    public List<ChallengeDto> getPendingChallengesFor(Long userId) {
        return gameRepository.findByInvitedPlayerIdAndStatus(userId, GameStatus.WAITING_FOR_PLAYER).stream()
                .map(g -> {
                    User challenger = userRepository.findById(g.getPlayerOneId()).orElse(null);
                    String username = challenger != null ? challenger.getUsername() : "?";
                    return new ChallengeDto(g.getId(), g.getPlayerOneId(), username);
                })
                .toList();
    }

    /**
     * Creates a game challenge from one user to another and notifies the invited user via WebSocket.
     *
     * @param challengerId  the ID of the user sending the challenge
     * @param invitedUserId the ID of the user being challenged
     * @return a GameDto representing the newly created challenge game
     */
    @Transactional
    public GameDto createChallenge(Long challengerId, Long invitedUserId) {
        GameDto game = gameService.createChallenge(challengerId, invitedUserId);
        User invited = userRepository.findById(invitedUserId).orElse(null);
        if (invited != null) {
            User challenger = userRepository.findById(challengerId).orElse(null);
            String challengerUsername = challenger != null ? challenger.getUsername() : "?";
            ChallengeDto dto = new ChallengeDto(game.id(), challengerId, challengerUsername);
            messagingTemplate.convertAndSendToUser(invited.getUsername(), "queue/challenges", dto);
        }
        return game;
    }

    /**
     * Persists a lobby chat message to the database and returns its DTO for broadcast.
     *
     * @param userId   the ID of the user sending the message
     * @param username the username of the sender
     * @param content  the text content of the message
     * @return a ChatMessageDto representing the saved message
     */
    @Transactional
    public ChatMessageDto sendLobbyChatMessage(Long userId, String username, String content) {
        return chatService.sendLobbyMessage(userId, username, content);
    }

    /**
     * Returns the most recent lobby chat messages up to the specified limit.
     *
     * @param limit the maximum number of messages to retrieve
     * @return a list of ChatMessageDto objects ordered by recency
     */
    @Transactional(readOnly = true)
    public List<ChatMessageDto> getRecentLobbyChat(int limit) {
        return chatService.getRecentLobbyMessages(limit);
    }
}
