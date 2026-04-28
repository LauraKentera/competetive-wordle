package edu.rit.backend.friendship.model;

/**
 * Enum representing the possible states of a friendship relationship between two users.
 */
public enum FriendshipStatus {
    /** The friend request has been sent but not yet responded to. */
    PENDING,

    /** The friend request has been accepted; both users are now friends. */
    ACCEPTED,

    /** The friend request was declined by the addressee. */
    REJECTED,

    /** One user has blocked the other, preventing any further interaction. */
    BLOCKED
}
