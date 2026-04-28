package edu.rit.backend.user.model;

/**
 * Presence state of a {@link User}, broadcast to the lobby via WebSocket.
 *
 * <ul>
 *   <li>{@link #ONLINE}  — logged in and available to accept game invites</li>
 *   <li>{@link #OFFLINE} — not connected; default state on account creation</li>
 *   <li>{@link #IN_GAME} — currently in an active match; cannot be invited</li>
 * </ul>
 */
public enum UserStatus {
    ONLINE,
    OFFLINE,
    IN_GAME
}
