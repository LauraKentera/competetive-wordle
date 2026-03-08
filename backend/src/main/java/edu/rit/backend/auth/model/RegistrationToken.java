package edu.rit.backend.auth.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Secure nonce required for registration. Validated (token, expiration, client IP/User-Agent) before user creation.
 */
@Entity
@Table(name = "registration_tokens")
public class RegistrationToken {

    private static final int TOKEN_VALIDITY_MINUTES = 15;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "token_id")
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean used = false;

    protected RegistrationToken() {
        // JPA
    }

    public RegistrationToken(String token, String ipAddress, String userAgent, Instant createdAt) {
        this.token = token;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        this.createdAt = createdAt;
        this.expiresAt = createdAt.plusSeconds(TOKEN_VALIDITY_MINUTES * 60L);
    }

    public Long getId() {
        return id;
    }

    public String getToken() {
        return token;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public boolean isUsed() {
        return used;
    }

    public void markUsed() {
        this.used = true;
    }

    public boolean isExpired(Instant now) {
        return now.isAfter(expiresAt);
    }
}
