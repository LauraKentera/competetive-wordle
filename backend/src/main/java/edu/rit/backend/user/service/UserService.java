package edu.rit.backend.user.service;

import edu.rit.backend.user.dto.UserResponse;
import edu.rit.backend.user.model.Role;
import edu.rit.backend.user.model.User;
import edu.rit.backend.user.repo.UserRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository users;

    public UserService(UserRepository users) {
        this.users = users;
    }

    @Transactional(readOnly = true)
    public Optional<User> findByUsername(String username) {
        return users.findByUsername(username);
    }

    @Transactional
    public User createUser(String username, String passwordHash, Role role) {
        if (users.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken");
        }
        return users.save(new User(username, passwordHash, role));
    }

    @Transactional
    public UserResponse updateAvatar(Long userId, int avatarId) {
        User user = users.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setAvatarId(avatarId);
        return UserResponse.from(users.save(user));
    }
}
