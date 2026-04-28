package edu.rit.backend.chat.controller;

import edu.rit.backend.chat.dto.ChatMessageDto;
import edu.rit.backend.chat.dto.DmRoomDto;
import edu.rit.backend.chat.service.DirectMessageService;
import edu.rit.backend.user.repo.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dm")
public class DirectMessageController {

    // Service responsible for handling direct message business logic
    private final DirectMessageService directMessageService;

    // Repository used to retrieve user information from the database
    private final UserRepository userRepository;

    public DirectMessageController(DirectMessageService directMessageService,
                                   UserRepository userRepository) {
        this.directMessageService = directMessageService;
        this.userRepository = userRepository;
    }

    // Retrieves an existing DM room between the current user and the target user,
    // or creates one if it does not already exist
    @GetMapping("/{userId}")
    public ResponseEntity<DmRoomDto> getOrCreateDmRoom(@PathVariable Long userId,
                                                        @AuthenticationPrincipal Jwt jwt) {
        // Resolve the currently authenticated user's ID from the JWT token
        Long currentUserId = resolveUserId(jwt);

        // Delegate to service layer to get or create the DM room
        DmRoomDto dto = directMessageService.getOrCreateDmRoom(currentUserId, userId);

        // Return the DM room data
        return ResponseEntity.ok(dto);
    }

    // Retrieves paginated messages from a specific DM room for the current user
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getDmMessages(@PathVariable Long roomId,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @AuthenticationPrincipal Jwt jwt) {
        // Resolve the currently authenticated user's ID from the JWT token
        Long currentUserId = resolveUserId(jwt);

        // Fetch messages for the given room and page, ensuring user access
        List<ChatMessageDto> messages = directMessageService.getDmMessages(roomId, currentUserId, page);

        // Return the list of messages
        return ResponseEntity.ok(messages);
    }

    // Extracts the user ID from the JWT by resolving the username (subject)
    // and looking it up in the database
    private Long resolveUserId(Jwt jwt) {
        String username = jwt.getSubject();

        // Find user by username or throw an exception if not found
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }
}