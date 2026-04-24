package edu.rit.backend.user.dto;

import edu.rit.backend.user.model.Role;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.model.UserStatus;

import java.time.Instant;

public record UserResponse(
        Long id,
        String username,
        Role role,
        UserStatus status,
        Instant lastLogin,
        int gamesPlayed,
        int gamesWon,
        int gamesLost,
        int gamesDrawn,
        int gamesForfeited
) {}
public record UserResponse(Long id, String username, Role role, UserStatus status, Instant lastLogin, int avatarId) {

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getStatus(),
                user.getLastLogin(),
                user.getAvatarId()
        );
    }
}
