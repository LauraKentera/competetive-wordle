package edu.rit.backend.chat.model;

import jakarta.persistence.*;
import java.util.Objects;

@Entity
@Table(name = "chat_rooms")
public class ChatRoom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_room_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChatRoomType type;

    @Column(name = "game_id")
    private Long gameId;

    protected ChatRoom() {
    }

    public ChatRoom(ChatRoomType type, Long gameId) {
        this.type = type;
        this.gameId = gameId;
    }

    public Long getId() {
        return id;
    }

    public ChatRoomType getType() {
        return type;
    }

    public Long getGameId() {
        return gameId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ChatRoom chatRoom = (ChatRoom) o;
        return Objects.equals(id, chatRoom.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
