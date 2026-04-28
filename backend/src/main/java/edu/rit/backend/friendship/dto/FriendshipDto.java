package edu.rit.backend.friendship.dto;

import edu.rit.backend.friendship.model.FriendshipStatus;
import edu.rit.backend.user.dto.UserResponse;
import java.time.Instant;

/**
 * Data Transfer Object representing a friendship relationship.
 * Used to expose friendship data to API consumers without revealing internal entity details.
 *
 * @param id        the unique identifier of the friendship record
 * @param user      the other user involved in the friendship (not the requester)
 * @param status    the current status of the friendship (e.g. PENDING, ACCEPTED, REJECTED)
 * @param createdAt the timestamp when the friendship request was created
 */
public record FriendshipDto(Long id, UserResponse user, FriendshipStatus status, Instant createdAt) {}
