/** Session storage key for the JWT access token. */
const TOKEN_KEY = "token";

/** Session storage key for the token expiry timestamp (in milliseconds). */
const EXPIRY_KEY = "token_expiry";

/**
 * Persists the JWT token and its expiry time to session storage.
 * The expiry is calculated from the current time plus the provided duration.
 *
 * @param token            - The JWT access token to store.
 * @param expiresInSeconds - The token's lifetime in seconds from now.
 */
export function setToken(token: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(EXPIRY_KEY, expiresAt.toString());
}

/**
 * Retrieves the token expiry timestamp from session storage.
 *
 * @returns The expiry time as a Unix timestamp in milliseconds,
 *          or null if the value is missing or not a valid number.
 */
export function getTokenExpiry(): number | null {
  const expiry = sessionStorage.getItem(EXPIRY_KEY);
  if (!expiry) {
    return null;
  }

  const parsed = Number(expiry);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

/**
 * Checks whether the stored token has expired.
 * A missing or unparseable expiry is treated as expired.
 *
 * @returns True if the token is expired or has no expiry, false if still valid.
 */
export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (expiry === null) {
    return true;
  }

  return Date.now() >= expiry;
}

/**
 * Retrieves the stored JWT token if it has not yet expired.
 * Automatically clears the token from storage if it is expired.
 *
 * @returns The JWT token string, or null if expired or not present.
 */
export function getToken(): string | null {
  if (isTokenExpired()) {
    clearToken();
    return null;
  }

  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Removes both the token and its expiry timestamp from session storage.
 * Called on logout or when an expired token is detected.
 */
export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
}
