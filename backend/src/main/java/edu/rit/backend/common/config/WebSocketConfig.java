package edu.rit.backend.common.config;

import java.util.Arrays;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Spring WebSocket configuration for STOMP messaging.
 * Registers the /ws endpoint, configures the message broker topics and prefixes,
 * and attaches the JWT authentication channel interceptor to the inbound channel.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor;
    private final String[] allowedOrigins;

    /**
     * Constructs a WebSocketConfig with the JWT auth interceptor and allowed origins.
     *
     * @param webSocketAuthChannelInterceptor interceptor that authenticates STOMP CONNECT frames
     * @param rawAllowedOrigins               comma-separated string of allowed origin URLs,
     *                                        defaults to {@code http://localhost:3000,http://localhost:5173}
     */
    public WebSocketConfig(
            WebSocketAuthChannelInterceptor webSocketAuthChannelInterceptor,
            @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}") String rawAllowedOrigins
    ) {
        this.webSocketAuthChannelInterceptor = webSocketAuthChannelInterceptor;
        List<String> origins = Arrays.stream(rawAllowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
        this.allowedOrigins = origins.toArray(String[]::new);
    }

    /**
     * Configures the message broker with application destination prefix {@code /app},
     * simple broker topics {@code /topic} and {@code /queue},
     * and user destination prefix {@code /user}.
     *
     * @param config the message broker registry
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.setApplicationDestinationPrefixes("/app");
        config.enableSimpleBroker("/topic", "/queue");
        config.setUserDestinationPrefix("/user");
    }

    /**
     * Registers the {@link WebSocketAuthChannelInterceptor} on the inbound channel
     * to authenticate STOMP frames before they reach message handlers.
     *
     * @param registration the inbound channel registration
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthChannelInterceptor);
    }

    /**
     * Registers the {@code /ws} STOMP endpoint with SockJS fallback support.
     *
     * @param registry the STOMP endpoint registry
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins(allowedOrigins)
                .withSockJS();
    }
}