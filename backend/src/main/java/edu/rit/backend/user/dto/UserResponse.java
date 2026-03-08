package edu.rit.backend.user.dto;

import edu.rit.backend.user.model.Role;
import edu.rit.backend.user.model.UserStatus;

import java.time.Instant;

public record UserResponse(Long id, String username, Role role, UserStatus status, Instant lastLogin) {}