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

@Service
public class LobbyService {

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GameService gameService;
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

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

    @Transactional(readOnly = true)
    public List<LobbyPlayerDto> getOnlinePlayers() {
        return userRepository.findByStatus(UserStatus.ONLINE).stream()
                .map(u -> new LobbyPlayerDto(u.getId(), u.getUsername(), u.getStatus()))
                .toList();
    }

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
     * Persist lobby message to DB, push to Redis cache, and return DTO for
     * broadcast.
     */
    @Transactional
    public ChatMessageDto sendLobbyChatMessage(Long userId, String username, String content) {
        return chatService.sendLobbyMessage(userId, username, content);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getRecentLobbyChat(int limit) {
        return chatService.getRecentLobbyMessages(limit);
    }
}