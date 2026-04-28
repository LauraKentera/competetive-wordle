package edu.rit.backend.user.model;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * JPA entity representing a registered player.
 *
 * <p>Stores authentication credentials, role, online status, selected avatar,
 * and lifetime game statistics. All stat columns default to {@code 0} and are
 * incremented atomically via {@link edu.rit.backend.user.repo.UserRepository}
 * bulk-update queries rather than fetching the full entity.
 */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "last_login")
    private Instant lastLogin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserStatus status = UserStatus.OFFLINE;

    @Column(name = "games_played", nullable = false)
    private int gamesPlayed = 0;

    @Column(name = "games_won", nullable = false)
    private int gamesWon = 0;

    @Column(name = "games_lost", nullable = false)
    private int gamesLost = 0;

    @Column(name = "games_drawn", nullable = false)
    private int gamesDrawn = 0;

    @Column(name = "games_forfeited", nullable = false)
    private int gamesForfeited = 0;

    @Column(name = "avatar_id", nullable = false)
    private int avatarId = 1;

    /** Required by JPA — not for direct use. */
    protected User() {
    }

    /**
     * Creates a new user with the given credentials and role.
     *
     * @param username     unique display name
     * @param passwordHash bcrypt hash of the raw password
     * @param role         assigned role; defaults to {@link Role#USER} if {@code null}
     */
    public User(String username, String passwordHash, Role role) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role == null ? Role.USER : role;
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getLastLogin() {
        return lastLogin;
    }

    public UserStatus getStatus() {
        return status;
    }

    public int getGamesPlayed() {
        return gamesPlayed;
    }

    public int getGamesWon() {
        return gamesWon;
    }

    public int getGamesLost() {
        return gamesLost;
    }

    public int getGamesDrawn() {
        return gamesDrawn;
    }

    public int getGamesForfeited() {
        return gamesForfeited;
    }

    public int getAvatarId() {
        return avatarId;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public void setLastLogin(Instant lastLogin) {
        this.lastLogin = lastLogin;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public void setAvatarId(int avatarId) {
        this.avatarId = avatarId;
    }
}
