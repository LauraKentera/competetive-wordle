package edu.rit.backend.user.controller;

import edu.rit.backend.user.dto.AvatarUpdateRequest;
import edu.rit.backend.user.dto.UserResponse;
import edu.rit.backend.user.repo.UserRepository;
import edu.rit.backend.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserRepository users;
    private final UserService userService;

    public UserController(UserRepository users, UserService userService) {
        this.users = users;
        this.userService = userService;
    }

    @GetMapping("/api/users/{id}")
    public UserResponse getById(@PathVariable Long id) {
        var user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));

        return UserResponse.from(user);
    }

    @GetMapping("/api/me")
    public UserResponse me(org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();
        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserResponse.from(user);
    }

    @PatchMapping("/api/me/avatar")
    public ResponseEntity<UserResponse> updateAvatar(@Valid @RequestBody AvatarUpdateRequest req,
                                                     @AuthenticationPrincipal Jwt jwt) {
        Number userIdClaim = jwt.getClaim("uid");
        Long userId = userIdClaim.longValue();

        return ResponseEntity.ok(userService.updateAvatar(userId, req.avatarId()));
    }
}
