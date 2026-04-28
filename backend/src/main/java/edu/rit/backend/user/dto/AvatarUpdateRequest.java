package edu.rit.backend.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

/**
 * Request body for the {@code PATCH /api/me/avatar} endpoint.
 *
 * @param avatarId the avatar to assign; must be between 1 and 3 inclusive
 */
public record AvatarUpdateRequest(@Min(1) @Max(3) int avatarId) {}
