package edu.rit.backend.chat.repo;

import edu.rit.backend.chat.model.ChatRoom;
import edu.rit.backend.chat.model.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    Optional<ChatRoom> findByTypeAndGameId(ChatRoomType type, Long gameId);

    Optional<ChatRoom> findByType(ChatRoomType type);
}
