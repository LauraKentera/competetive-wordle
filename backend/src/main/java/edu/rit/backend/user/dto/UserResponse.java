package edu.rit.backend.user.dto;

import edu.rit.backend.user.model.Role;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.model.UserStatus;

import java.time.Instant;

/**
 * Read-only projection of a {@link User} returned by the REST API.
 *
 * <p>Excludes sensitive fields such as {@code passwordHash}. Use the
 * {@link #from(User)} factory to construct an instance from a {@link User} entity.
 */
public record UserResponse(
        Long id,
        String username,
        Role role,
        UserStatus status,
        Instant lastLogin,
        int avatarId,
        int gamesPlayed,
        int gamesWon,
        int gamesLost,
        int gamesDrawn,
        int gamesForfeited
) {

    /**
     * Maps a {@link User} entity to its API representation.
     *
     * @param user the source entity
     * @return a new {@link UserResponse} populated from the entity's fields
     */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getStatus(),
                user.getLastLogin(),
                user.getAvatarId(),
                user.getGamesPlayed(),
                user.getGamesWon(),
                user.getGamesLost(),
                user.getGamesDrawn(),
                user.getGamesForfeited()
        );
    }
}
