package edu.rit.backend.chat.repo;

import edu.rit.backend.chat.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatRoomIdOrderBySentAtAsc(Long chatRoomId, Pageable pageable);
}
