package edu.rit.backend.friendship.controller;

import edu.rit.backend.friendship.dto.FriendshipDto;
import edu.rit.backend.friendship.service.FriendshipService;
import edu.rit.backend.user.dto.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendshipService friendshipService;

    public FriendController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    @PostMapping("/request/{userId}")
    public ResponseEntity<FriendshipDto> sendRequest(
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(friendshipService.sendRequest(currentUserId(jwt), userId));
    }

    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<FriendshipDto> acceptRequest(
            @PathVariable Long friendshipId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(friendshipService.acceptRequest(friendshipId, currentUserId(jwt)));
    }

    @PostMapping("/reject/{friendshipId}")
    public ResponseEntity<FriendshipDto> rejectRequest(
            @PathVariable Long friendshipId,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(friendshipService.rejectRequest(friendshipId, currentUserId(jwt)));
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getFriends(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(friendshipService.getFriends(currentUserId(jwt)));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FriendshipDto>> getPendingRequests(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(friendshipService.getPendingRequests(currentUserId(jwt)));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeFriend(
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt) {
        friendshipService.removeFriend(currentUserId(jwt), userId);
        return ResponseEntity.noContent().build();
    }

    private Long currentUserId(Jwt jwt) {
        Number uid = jwt.getClaim("uid");
        return uid.longValue();
    }
}
