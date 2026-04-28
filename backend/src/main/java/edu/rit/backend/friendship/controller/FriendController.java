package edu.rit.backend.friendship.controller;

import edu.rit.backend.friendship.dto.FriendshipDto;
import edu.rit.backend.friendship.service.FriendshipService;
import edu.rit.backend.user.dto.UserResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

/**
 * REST controller for managing friend relationships between users.
 * All endpoints are secured and require a valid JWT token.
 * Base path: /api/friends
 */
@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendshipService friendshipService;
    private final SimpMessagingTemplate messagingTemplate;

    public FriendController(FriendshipService friendshipService, SimpMessagingTemplate messagingTemplate) {
        this.friendshipService = friendshipService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Sends a friend request from the currently authenticated user to the specified user.
     * POST /api/friends/request/{userId}
     *
     * @param userId the ID of the user to send the friend request to
     * @param jwt    the JWT token of the authenticated user
     * @return the created FriendshipDto representing the pending request
     */
    @PostMapping("/request/{userId}")
    public ResponseEntity<FriendshipDto> sendRequest(
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt) {
        FriendshipDto dto = friendshipService.sendRequest(currentUserId(jwt), userId);
        messagingTemplate.convertAndSendToUser(dto.user().username(), "/queue/friend-requests", Map.of("type", "FRIEND_UPDATE", "subtype", "NEW_REQUEST"));
        return ResponseEntity.ok(dto);
    }

    /**
     * Accepts an incoming friend request on behalf of the authenticated user.
     * POST /api/friends/accept/{friendshipId}
     *
     * @param friendshipId the ID of the friendship request to accept
     * @param jwt          the JWT token of the authenticated user
     * @return the updated FriendshipDto reflecting the accepted status
     */
    @PostMapping("/accept/{friendshipId}")
    public ResponseEntity<FriendshipDto> acceptRequest(
            @PathVariable Long friendshipId,
            @AuthenticationPrincipal Jwt jwt) {
        FriendshipDto dto = friendshipService.acceptRequest(friendshipId, currentUserId(jwt));
        messagingTemplate.convertAndSendToUser(dto.user().username(), "/queue/friend-requests", Map.of("type", "FRIEND_UPDATE", "subtype", "REQUEST_ACCEPTED"));
        return ResponseEntity.ok(dto);
    }

    /**
     * Rejects an incoming friend request on behalf of the authenticated user.
     * POST /api/friends/reject/{friendshipId}
     *
     * @param friendshipId the ID of the friendship request to reject
     * @param jwt          the JWT token of the authenticated user
     * @return the updated FriendshipDto reflecting the rejected status
     */
    @PostMapping("/reject/{friendshipId}")
    public ResponseEntity<FriendshipDto> rejectRequest(
            @PathVariable Long friendshipId,
            @AuthenticationPrincipal Jwt jwt) {
        FriendshipDto dto = friendshipService.rejectRequest(friendshipId, currentUserId(jwt));
        messagingTemplate.convertAndSendToUser(dto.user().username(), "/queue/friend-requests", Map.of("type", "FRIEND_UPDATE", "subtype", "REQUEST_REJECTED"));
        return ResponseEntity.ok(dto);
    }

    /**
     * Retrieves the list of accepted friends for the authenticated user.
     * GET /api/friends
     *
     * @param jwt the JWT token of the authenticated user
     * @return a list of UserResponse objects representing the user's friends
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getFriends(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(friendshipService.getFriends(currentUserId(jwt)));
    }

    /**
     * Retrieves all pending (unanswered) friend requests received by the authenticated user.
     * GET /api/friends/pending
     *
     * @param jwt the JWT token of the authenticated user
     * @return a list of FriendshipDto objects representing pending incoming requests
     */
    @GetMapping("/pending")
    public ResponseEntity<List<FriendshipDto>> getPendingRequests(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(friendshipService.getPendingRequests(currentUserId(jwt)));
    }

    /**
     * Removes an existing friendship between the authenticated user and the specified user.
     * DELETE /api/friends/{userId}
     *
     * @param userId the ID of the friend to remove
     * @param jwt    the JWT token of the authenticated user
     * @return 204 No Content on successful removal
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> removeFriend(
            @PathVariable Long userId,
            @AuthenticationPrincipal Jwt jwt) {
        friendshipService.removeFriend(currentUserId(jwt), userId).ifPresent(username ->
            messagingTemplate.convertAndSendToUser(username, "/queue/friend-requests",
                    Map.of("type", "FRIEND_UPDATE", "subtype", "FRIEND_REMOVED"))
        );
        return ResponseEntity.noContent().build();
    }

    /**
     * Extracts the current user's ID from the provided JWT token.
     * Reads the custom "uid" claim and converts it to a Long.
     *
     * @param jwt the JWT token containing the user's claims
     * @return the authenticated user's ID as a Long
     */
    private Long currentUserId(Jwt jwt) {
        Number uid = jwt.getClaim("uid");
        return uid.longValue();
    }
}
