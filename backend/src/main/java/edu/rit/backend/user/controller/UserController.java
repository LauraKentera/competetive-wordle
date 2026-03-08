package edu.rit.backend.user.controller;

import edu.rit.backend.user.dto.UserResponse;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserRepository users;

    public UserController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/api/users/{id}")
    public UserResponse getById(@PathVariable Long id) {
        var user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new UserResponse(user.getId(), user.getUsername(), user.getRole(), user.getStatus(), user.getLastLogin());
    }

    @GetMapping("/api/me")
    public UserResponse me(org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();
        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return new UserResponse(user.getId(), user.getUsername(), user.getRole(), user.getStatus(), user.getLastLogin());
    }
}