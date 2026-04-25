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

    private final DirectMessageService directMessageService;
    private final UserRepository userRepository;

    public DirectMessageController(DirectMessageService directMessageService,
                                   UserRepository userRepository) {
        this.directMessageService = directMessageService;
        this.userRepository = userRepository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<DmRoomDto> getOrCreateDmRoom(@PathVariable Long userId,
                                                        @AuthenticationPrincipal Jwt jwt) {
        Long currentUserId = resolveUserId(jwt);
        DmRoomDto dto = directMessageService.getOrCreateDmRoom(currentUserId, userId);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getDmMessages(@PathVariable Long roomId,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @AuthenticationPrincipal Jwt jwt) {
        Long currentUserId = resolveUserId(jwt);
        List<ChatMessageDto> messages = directMessageService.getDmMessages(roomId, currentUserId, page);
        return ResponseEntity.ok(messages);
    }

    private Long resolveUserId(Jwt jwt) {
        String username = jwt.getSubject();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }
}
