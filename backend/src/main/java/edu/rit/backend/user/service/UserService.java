package edu.rit.backend.user.service;

import edu.rit.backend.user.dto.UserResponse;
import edu.rit.backend.user.model.Role;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.repo.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Business logic for user account management.
 *
 * <p>Handles user lookup, registration, and profile updates. Authentication
 * credential hashing is the responsibility of the caller (e.g. the auth service)
 * — this service only stores the pre-hashed value it receives.
 */
@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    /**
     * Looks up a user by username.
     *
     * @param username the unique username to search for
     * @return an {@link Optional} containing the user if found
     */
    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return users.findByUsername(username);
    }

    /**
     * Registers a new user account.
     *
     * @param username     desired unique username
     * @param passwordHash bcrypt hash of the raw password
     * @param role         role to assign; {@link Role#USER} is used if {@code null}
     * @return the persisted {@link User}
     * @throws IllegalArgumentException if the username is already taken
     */
    @Transactional
    public User createUser(String username, String passwordHash, Role role) {
        if (users.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken");
        }
        return users.save(new User(username, passwordHash, role));
    }

    /**
     * Changes the avatar selection for the authenticated user.
     *
     * @param userId   ID of the user to update
     * @param avatarId new avatar identifier (1–3)
     * @return updated user data as a {@link UserResponse}
     * @throws IllegalArgumentException if no user exists with the given ID
     */
    @Transactional
    public UserResponse updateAvatar(Long userId, int avatarId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setAvatarId(avatarId);
        return UserResponse.from(users.save(user));
    }
}
