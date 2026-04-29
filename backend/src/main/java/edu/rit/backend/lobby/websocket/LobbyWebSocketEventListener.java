package edu.rit.backend.lobby.websocket;

import edu.rit.backend.game.service.GameService;
import edu.rit.backend.lobby.dto.LobbyPlayerDto;
import edu.rit.backend.lobby.service.LobbyService;
import edu.rit.backend.user.model.UserStatus;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sets user status to ONLINE/OFFLINE on WebSocket connect/disconnect and
 * broadcasts
 * the list of online players to /topic/lobby/players.
 */
@Component
public class LobbyWebSocketEventListener {

    private final UserRepository userRepository;
    private final LobbyService lobbyService;
    private final SimpMessagingTemplate messagingTemplate;
    private final GameService gameService;

    private final Map<String, String> sessionIdToUsername = new ConcurrentHashMap<>();

    public LobbyWebSocketEventListener(UserRepository userRepository,
            LobbyService lobbyService,
            SimpMessagingTemplate messagingTemplate, GameService gameService) {
        this.userRepository = userRepository;
        this.lobbyService = lobbyService;
        this.messagingTemplate = messagingTemplate;
        this.gameService = gameService;
    }

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        String username = getUsername(event.getUser());

        if (username == null)
            return;

        sessionIdToUsername.put(event.getMessage().getHeaders().get("simpSessionId", String.class), username);

        userRepository.findByUsername(username).ifPresent(user -> {
            user.setStatus(UserStatus.ONLINE);
            userRepository.save(user);
        });

        broadcastOnlinePlayers();
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        String username = getUsername(event.getUser());
        if (username == null) {
            username = sessionIdToUsername.remove(sessionId);
        } else {
            sessionIdToUsername.remove(sessionId);
        }

        if (username != null) {
            final String finalUsername = username;
            userRepository.findByUsername(finalUsername).ifPresent(user -> {
                if (user.getStatus() != UserStatus.IN_GAME) {
                    user.setStatus(UserStatus.OFFLINE);
                    userRepository.save(user);
                }
                gameService.abandonActiveGames(user.getId());
            });
            broadcastOnlinePlayers();
        }
    }

    private static String getUsername(java.security.Principal principal) {
        return principal != null ? principal.getName() : null;
    }

    private void broadcastOnlinePlayers() {
        List<LobbyPlayerDto> players = lobbyService.getOnlinePlayers();
        messagingTemplate.convertAndSend("/topic/lobby/players", players);
    }
}
