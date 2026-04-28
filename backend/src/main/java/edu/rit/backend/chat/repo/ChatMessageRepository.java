package edu.rit.backend.chat.repo;

import edu.rit.backend.chat.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Repository interface for accessing chat message data from the database
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Retrieves messages for a specific chat room ordered by send time (oldest first)
    // Supports pagination via Pageable
    List<ChatMessage> findByChatRoomIdOrderBySentAtAsc(Long chatRoomId, Pageable pageable);

    // Retrieves messages for a specific chat room ordered by send time (newest first)
    // Supports pagination via Pageable (useful for loading recent messages)
    List<ChatMessage> findByChatRoomIdOrderBySentAtDesc(Long chatRoomId, Pageable pageable);
}