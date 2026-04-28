package edu.rit.backend.common.config;

import edu.rit.backend.chat.service.DirectMessageService;
import edu.rit.backend.game.repo.GameRepository;
import edu.rit.backend.game.model.Game;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Authenticates STOMP CONNECT frames using JWT from the Authorization header,
 * and enforces per-topic subscription authorization on SUBSCRIBE frames.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private static final Pattern GAME_TOPIC_PATTERN = Pattern.compile("^/topic/game/(\\d+)(/.*)?$");
    private static final Pattern DM_TOPIC_PATTERN   = Pattern.compile("^/topic/dm/(\\d+)$");

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;
    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final DirectMessageService directMessageService;

    public WebSocketAuthChannelInterceptor(JwtDecoder jwtDecoder,
                                           JwtAuthenticationConverter jwtAuthenticationConverter,
                                           UserRepository userRepository,
                                           GameRepository gameRepository,
                                           @Lazy DirectMessageService directMessageService) {
        this.jwtDecoder = jwtDecoder;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
        this.userRepository = userRepository;
        this.gameRepository = gameRepository;
        this.directMessageService = directMessageService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();

        if (StompCommand.CONNECT.equals(command)) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            if (authHeaders == null || authHeaders.isEmpty()) {
                throw new MessageDeliveryException("Missing Authorization header");
            }
            String header = authHeaders.get(0);
            if (header == null || !header.startsWith("Bearer ")) {
                throw new MessageDeliveryException("Invalid Authorization header");
            }
            String token = header.substring(7).trim();
            try {
                Jwt jwt = jwtDecoder.decode(token);
                var authentication = jwtAuthenticationConverter.convert(jwt);
                if (authentication == null) {
                    throw new MessageDeliveryException("Token authentication failed");
                }
                accessor.setUser(authentication);
            } catch (MessageDeliveryException e) {
                throw e;
            } catch (Exception e) {
                throw new MessageDeliveryException("Invalid or expired token");
            }
        }

        if (StompCommand.SUBSCRIBE.equals(command)) {
            Principal user = accessor.getUser();
            if (user == null) {
                throw new MessageDeliveryException("Not authenticated");
            }
            enforceSubscriptionAuthorization(accessor.getDestination(), user.getName());
        }

        return message;
    }

    private void enforceSubscriptionAuthorization(String destination, String username) {
        if (destination == null) return;

        // Lobby topics and user-specific queues are open to any authenticated user
        if (destination.startsWith("/topic/lobby/") || destination.startsWith("/user/")) return;

        // Game topics: /topic/game/{gameId} and sub-paths (/chat, /presence, etc.)
        Matcher gameMatcher = GAME_TOPIC_PATTERN.matcher(destination);
        if (gameMatcher.matches()) {
            Long gameId = Long.parseLong(gameMatcher.group(1));
            Long userId = resolveUserId(username);
            Game game = gameRepository.findById(gameId)
                    .orElseThrow(() -> new MessageDeliveryException("Game not found"));
            if (!userId.equals(game.getPlayerOneId())
                    && !userId.equals(game.getPlayerTwoId())
                    && !userId.equals(game.getInvitedPlayerId())) {
                throw new MessageDeliveryException("Not authorized to subscribe to this game topic");
            }
            return;
        }

        // DM topics: /topic/dm/{roomId}
        Matcher dmMatcher = DM_TOPIC_PATTERN.matcher(destination);
        if (dmMatcher.matches()) {
            Long roomId = Long.parseLong(dmMatcher.group(1));
            Long userId = resolveUserId(username);
            if (!directMessageService.isMember(roomId, userId)) {
                throw new MessageDeliveryException("Not authorized to subscribe to this DM room");
            }
        }
    }

    private Long resolveUserId(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new MessageDeliveryException("User not found"))
                .getId();
    }
}
