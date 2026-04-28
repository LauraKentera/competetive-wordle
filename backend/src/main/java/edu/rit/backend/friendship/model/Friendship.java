package edu.rit.backend.friendship.model;

import edu.rit.backend.user.model.User;
import jakarta.persistence.*;
import java.time.Instant;
import static jakarta.persistence.FetchType.LAZY;

/**
 * JPA entity representing a friendship relationship between two users.
 * A unique constraint on (requester_id, addressee_id) ensures that only one
 * friendship record can exist between any given pair of users.
 */
@Entity
@Table(name = "friendships", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"requester_id", "addressee_id"})
})
public class Friendship {

    /** Auto-generated primary key for the friendship record. */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user who initiated the friend request.
     * Loaded lazily to avoid unnecessary database joins.
     */
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    /**
     * The user who received the friend request.
     * Loaded lazily to avoid unnecessary database joins.
     */
    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "addressee_id", nullable = false)
    private User addressee;

    /**
     * The current status of the friendship.
     * Stored as a string in the database. Defaults to PENDING on creation.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FriendshipStatus status = FriendshipStatus.PENDING;

    /** Timestamp of when the friendship record was first created. */
    private Instant createdAt;

    /** Timestamp of when the friendship record was last updated. */
    private Instant updatedAt;


    /**
     * Lifecycle callback invoked before the entity is first persisted.
     * Initializes both createdAt and updatedAt to the current time.
     */
    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    /**
     * Lifecycle callback invoked before an existing entity is updated.
     * Refreshes the updatedAt timestamp to the current time.
     */
    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    /**
     * Returns the unique ID of this friendship record.
     *
     * @return the friendship ID
     */
    public Long getId() { return id; }

    /**
     * Returns the user who sent the friend request.
     *
     * @return the requesting user
     */
    public User getRequester() { return requester; }

    /**
     * Sets the user who sent the friend request.
     *
     * @param requester the requesting user
     */
    public void setRequester(User requester) { this.requester = requester; }

    /**
     * Returns the user who received the friend request.
     *
     * @return the addressee user
     */
    public User getAddressee() { return addressee; }
    
    /**
     * Sets the user who received the friend request.
     *
     * @param addressee the addressee user
     */
    public void setAddressee(User addressee) { this.addressee = addressee; }

    /**
     * Returns the current status of the friendship.
     *
     * @return the friendship status
     */
    public FriendshipStatus getStatus() { return status; }
    
    /**
     * Updates the status of the friendship (e.g. from PENDING to ACCEPTED or REJECTED).
     *
     * @param status the new friendship status
     */
    public void setStatus(FriendshipStatus status) { this.status = status; }

    /**
     * Returns the timestamp when this friendship was created.
     *
     * @return the creation timestamp
     */
    public Instant getCreatedAt() { return createdAt; }
    
    /**
     * Returns the timestamp when this friendship was last updated.
     *
     * @return the last updated timestamp
     */
    public Instant getUpdatedAt() { return updatedAt; }
}
