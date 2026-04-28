package edu.rit.backend.user.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AvatarUpdateRequest(@Min(1) @Max(3) int avatarId) {}
