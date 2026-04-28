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
 * Spring event listener that tracks WebSocket session lifecycle events.
 * Sets user status to ONLINE on connect and OFFLINE on disconnect,
 * and broadcasts the updated online player list to /topic/lobby/players.
 */
@Component
public class LobbyWebSocketEventListener {

    private final UserRepository userRepository;
    private final LobbyService lobbyService;
    private final SimpMessagingTemplate messagingTemplate;
    private final GameService gameService;

    private final Map<String, String> sessionIdToUsername = new ConcurrentHashMap<>();

    /**
     * Constructs a LobbyWebSocketEventListener with the required dependencies.
     *
     * @param userRepository    repository for user data access and status updates
     * @param lobbyService      service for retrieving the current online player list
     * @param messagingTemplate template for broadcasting messages to WebSocket topics
     * @param gameService       service used to abandon active games on disconnect
     */
    public LobbyWebSocketEventListener(UserRepository userRepository,
            LobbyService lobbyService,
            SimpMessagingTemplate messagingTemplate, GameService gameService) {
        this.userRepository = userRepository;
        this.lobbyService = lobbyService;
        this.messagingTemplate = messagingTemplate;
        this.gameService = gameService;
    }

    /**
     * Handles a new WebSocket session connection.
     * Sets the connecting user's status to ONLINE and broadcasts the updated player list.
     *
     * @param event the session connected event containing the user's principal and session ID
     */
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

    /**
     * Handles a WebSocket session disconnection.
     * Sets the disconnecting user's status to OFFLINE (unless they are IN_GAME),
     * abandons any active games, and broadcasts the updated player list.
     *
     * @param event the session disconnect event containing the session ID and user principal
     */
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

    /**
     * Extracts the username from a security principal.
     *
     * @param principal the security principal, may be null
     * @return the username string, or null if the principal is null
     */
    private static String getUsername(java.security.Principal principal) {
        return principal != null ? principal.getName() : null;
    }

    /**
     * Fetches the current list of online players and broadcasts it to /topic/lobby/players.
     */
    private void broadcastOnlinePlayers() {
        List<LobbyPlayerDto> players = lobbyService.getOnlinePlayers();
        messagingTemplate.convertAndSend("/topic/lobby/players", players);
    }
}
