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

/**
 * REST controller exposing user profile endpoints.
 *
 * <p>All endpoints require a valid JWT. The {@code /api/me} and
 * {@code /api/me/avatar} endpoints operate on the currently authenticated
 * user; {@code /api/users/{id}} allows any authenticated user to look up
 * another player's public profile.
 */
@RestController
public class UserController {

    private final UserRepository users;
    private final UserService userService;

    public UserController(UserRepository users, UserService userService) {
        this.users = users;
        this.userService = userService;
    }

    /**
     * Returns the public profile of any registered user by their ID.
     *
     * @param id the user's database ID
     * @return the user's {@link UserResponse}
     * @throws IllegalArgumentException if no user with that ID exists
     */
    @GetMapping("/api/users/{id}")
    public UserResponse getById(@PathVariable Long id) {
        var user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserResponse.from(user);
    }

    /**
     * Returns the profile of the currently authenticated user.
     *
     * @param authentication Spring Security context populated from the JWT
     * @return the caller's {@link UserResponse}
     */
    @GetMapping("/api/me")
    public UserResponse me(org.springframework.security.core.Authentication authentication) {
        String username = authentication.getName();
        var user = users.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserResponse.from(user);
    }

    /**
     * Updates the avatar selection for the currently authenticated user.
     *
     * @param req request body containing the new {@code avatarId} (1–3)
     * @param jwt the decoded JWT used to resolve the caller's user ID
     * @return 200 OK with the updated {@link UserResponse}
     */
    @PatchMapping("/api/me/avatar")
    public ResponseEntity<UserResponse> updateAvatar(@Valid @RequestBody AvatarUpdateRequest req,
                                                     @AuthenticationPrincipal Jwt jwt) {
        Number userIdClaim = jwt.getClaim("uid");
        Long userId = userIdClaim.longValue();
        return ResponseEntity.ok(userService.updateAvatar(userId, req.avatarId()));
    }
}
