package edu.rit.backend.game.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "games")
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_one_id", nullable = false)
    private Long playerOneId;

    @Column(name = "player_two_id")
    private Long playerTwoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GameStatus status;

    @Column(name = "current_turn_player_id")
    private Long currentTurnPlayerId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public Game() {
    }

    public Game(Long playerOneId, GameStatus status) {
        this.playerOneId = playerOneId;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPlayerOneId() {
        return playerOneId;
    }

    public void setPlayerOneId(Long playerOneId) {
        this.playerOneId = playerOneId;
    }

    public Long getPlayerTwoId() {
        return playerTwoId;
    }

    public void setPlayerTwoId(Long playerTwoId) {
        this.playerTwoId = playerTwoId;
    }

    public GameStatus getStatus() {
        return status;
    }

    public void setStatus(GameStatus status) {
        this.status = status;
    }

    public Long getCurrentTurnPlayerId() {
        return currentTurnPlayerId;
    }

    public void setCurrentTurnPlayerId(Long currentTurnPlayerId) {
        this.currentTurnPlayerId = currentTurnPlayerId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isWaitingForPlayer() {
        return status == GameStatus.WAITING_FOR_PLAYER;
    }

    public boolean isInProgress() {
        return status == GameStatus.IN_PROGRESS;
    }

    public boolean isCompleted() {
        return status == GameStatus.COMPLETED;
    }

    public void startGame(Long playerTwoId) {
        if (this.status != GameStatus.WAITING_FOR_PLAYER) {
            throw new IllegalStateException("Game cannot be started. Current status: " + this.status);
        }
        this.playerTwoId = playerTwoId;
        this.status = GameStatus.IN_PROGRESS;
        this.currentTurnPlayerId = this.playerOneId;
    }

    public void endGame() {
        this.status = GameStatus.COMPLETED;
        this.currentTurnPlayerId = null;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Game game = (Game) o;
        return Objects.equals(id, game.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Game{" +
                "id=" + id +
                ", playerOneId=" + playerOneId +
                ", playerTwoId=" + playerTwoId +
                ", status=" + status +
                ", currentTurnPlayerId=" + currentTurnPlayerId +
                ", createdAt=" + createdAt +
                '}';
    }
}
