package edu.rit.backend.auth.service;

import edu.rit.backend.auth.dto.RegistrationTokenResponse;
import edu.rit.backend.auth.model.RegistrationToken;
import edu.rit.backend.auth.repo.RegistrationTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RegistrationTokenService {

    private final RegistrationTokenRepository registrationTokenRepository;

    public RegistrationTokenService(RegistrationTokenRepository registrationTokenRepository) {
        this.registrationTokenRepository = registrationTokenRepository;
    }

    @Transactional
    public RegistrationTokenResponse createToken(String clientIp, String clientUserAgent) {
        String tokenValue = UUID.randomUUID().toString();
        Instant now = Instant.now();
        RegistrationToken entity = new RegistrationToken(tokenValue, clientIp, clientUserAgent, now);
        registrationTokenRepository.save(entity);
        return new RegistrationTokenResponse(tokenValue, entity.getExpiresAt());
    }

    @Transactional
    public void validateAndConsume(String token, String clientIp, String clientUserAgent) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Registration token is required");
        }
        RegistrationToken entity = registrationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired registration token"));
        if (entity.isUsed()) {
            throw new IllegalArgumentException("Registration token has already been used");
        }
        if (entity.isExpired(Instant.now())) {
            throw new IllegalArgumentException("Registration token has expired");
        }
        if (clientIp != null && !clientIp.equals(entity.getIpAddress())) {
            throw new IllegalArgumentException("Registration token does not match this client");
        }
        if (clientUserAgent != null && !clientUserAgent.equals(entity.getUserAgent())) {
            throw new IllegalArgumentException("Registration token does not match this client");
        }
        entity.markUsed();
        registrationTokenRepository.save(entity);
    }
}
