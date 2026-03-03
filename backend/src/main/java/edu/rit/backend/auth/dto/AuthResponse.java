package edu.rit.backend.auth.dto;

import edu.rit.backend.user.model.Role;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresInSeconds,
        String username,
        Role role
) {}
