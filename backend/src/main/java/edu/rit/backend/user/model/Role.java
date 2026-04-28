package edu.rit.backend.user.model;

/**
 * Authorization roles assigned to a {@link User}.
 *
 * <ul>
 *   <li>{@link #USER} — standard player with no elevated privileges</li>
 *   <li>{@link #ADMIN} — platform administrator with full access</li>
 * </ul>
 */
public enum Role {
    USER,
    ADMIN
}