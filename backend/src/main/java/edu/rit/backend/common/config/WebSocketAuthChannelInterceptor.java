package edu.rit.backend.common.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Authenticates STOMP CONNECT frames using JWT from the Authorization header.
 * Client must send: Authorization: Bearer &lt;token&gt; in the CONNECT frame.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    public WebSocketAuthChannelInterceptor(JwtDecoder jwtDecoder, JwtAuthenticationConverter jwtAuthenticationConverter) {
        this.jwtDecoder = jwtDecoder;
        this.jwtAuthenticationConverter = jwtAuthenticationConverter;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        List<String> authHeaders = accessor.getNativeHeader("Authorization");
        if (authHeaders == null || authHeaders.isEmpty()) {
            return message;
        }

        String header = authHeaders.get(0);
        if (header == null || !header.startsWith("Bearer ")) {
            return message;
        }

        String token = header.substring(7).trim();
        if (token.isEmpty()) {
            return message;
        }

        try {
            Jwt jwt = jwtDecoder.decode(token);
            var authentication = jwtAuthenticationConverter.convert(jwt);
            if (authentication != null) {
                accessor.setUser(authentication);
            }
        } catch (Exception ignored) {
            // Invalid or expired token – connection will proceed without user (can be rejected by message handlers)
        }

        return message;
    }
}
