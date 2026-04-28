package edu.rit.backend.chat.repo;

import edu.rit.backend.chat.model.ChatRoom;
import edu.rit.backend.chat.model.ChatRoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

// Repository interface for accessing chat room data from the database
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {

    // Finds a chat room by its type and associated game ID (used for game-specific chats)
    Optional<ChatRoom> findByTypeAndGameId(ChatRoomType type, Long gameId);

    // Finds a chat room by its type (e.g., lobby chat)
    Optional<ChatRoom> findByType(ChatRoomType type);

    // Custom native query to find a direct message room shared between two users
    // Ensures that both users are members of the same room with type 'DIRECT'
    @Query(value = "SELECT r.* FROM chat_rooms r " +
                   "INNER JOIN chat_room_members m1 ON r.chat_room_id = m1.room_id AND m1.user_id = :userId1 " +
                   "INNER JOIN chat_room_members m2 ON r.chat_room_id = m2.room_id AND m2.user_id = :userId2 " +
                   "WHERE r.type = 'DIRECT' LIMIT 1",
           nativeQuery = true)
    Optional<ChatRoom> findDirectRoomByMemberIds(@Param("userId1") Long userId1, @Param("userId2") Long userId2);
}