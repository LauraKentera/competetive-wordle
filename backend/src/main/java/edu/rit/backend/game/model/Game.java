package edu.rit.backend.game.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "games")
public class Game {

    public static final int DEFAULT_MAX_ATTEMPTS = 6;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_one_id", nullable = false)
    private Long playerOneId;

    @Column(name = "player_two_id")
    private Long playerTwoId;

    /** When set, only this user can accept the game (challenge flow). */
    @Column(name = "invited_player_id")
    private Long invitedPlayerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GameStatus status;

    @Column(name = "current_turn_player_id")
    private Long currentTurnPlayerId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "word", length = 10)
    private String word;

    @Column(name = "word_length")
    private Integer wordLength;

    @Column(name = "max_attempts")
    private Integer maxAttempts;

    @Column(name = "winner_id")
    private Long winnerId;

    @Column(name = "ended_at")
    private Instant endedAt;

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

    public Long getInvitedPlayerId() {
        return invitedPlayerId;
    }

    public void setInvitedPlayerId(Long invitedPlayerId) {
        this.invitedPlayerId = invitedPlayerId;
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

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public Integer getWordLength() {
        return wordLength;
    }

    public void setWordLength(Integer wordLength) {
        this.wordLength = wordLength;
    }

    public Integer getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(Integer maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Long getWinnerId() {
        return winnerId;
    }

    public void setWinnerId(Long winnerId) {
        this.winnerId = winnerId;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
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

    public void startGame(Long playerTwoId, String secretWord, int maxAttempts, Long firstTurnPlayerId) {
        if (this.status != GameStatus.WAITING_FOR_PLAYER) {
            throw new IllegalStateException("Game cannot be started. Current status: " + this.status);
        }
        this.playerTwoId = playerTwoId;
        this.word = secretWord != null ? secretWord.toLowerCase() : null;
        this.wordLength = this.word != null ? this.word.length() : null;
        this.maxAttempts = maxAttempts;
        this.status = GameStatus.IN_PROGRESS;
        this.currentTurnPlayerId = firstTurnPlayerId;
    }

    public void endGame(Long winnerId) {
        this.status = GameStatus.COMPLETED;
        this.currentTurnPlayerId = null;
        this.winnerId = winnerId;
        this.endedAt = Instant.now();
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
