package edu.rit.backend.friendship.dto;

import edu.rit.backend.friendship.model.FriendshipStatus;
import edu.rit.backend.user.dto.UserResponse;

import java.time.Instant;

public record FriendshipDto(Long id, UserResponse user, FriendshipStatus status, Instant createdAt) {}
