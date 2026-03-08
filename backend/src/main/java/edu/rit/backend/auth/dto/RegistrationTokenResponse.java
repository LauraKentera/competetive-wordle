package edu.rit.backend.auth.dto;

import java.time.Instant;

public record RegistrationTokenResponse(String token, Instant expiresAt) {}
