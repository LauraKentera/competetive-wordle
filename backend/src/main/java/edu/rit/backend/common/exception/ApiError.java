package edu.rit.backend.common.exception;

import java.time.Instant;

/**
 * Represents a structured error response body returned by the API on failed requests.
 * Serialized to JSON and returned alongside appropriate HTTP error status codes.
 */
public class ApiError {
    private final Instant timestamp;
    private final int status;
    private final String error;
    private final String message;
    private final String path;

    /**
     * Constructs a new ApiError with all required fields.
     *
     * @param timestamp the exact time the error occurred
     * @param status    the HTTP status code (e.g. 400, 404, 500)
     * @param error     the HTTP status reason phrase (e.g. "Bad Request")
     * @param message   a human-readable description of the error
     * @param path      the request URI that triggered the error
     */
    public ApiError(Instant timestamp, int status, String error, String message, String path) {
        this.timestamp = timestamp;
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }

    /** @return the time the error occurred */
    public Instant getTimestamp() {
        return timestamp;
    }

    /** @return the HTTP status code */
    public int getStatus() {
        return status;
    }

    /** @return the HTTP status reason phrase */
    public String getError() {
        return error;
    }

    /** @return the human-readable error description */
    public String getMessage() {
        return message;
    }

    /** @return the request URI that triggered the error */
    public String getPath() {
        return path;
    }
}