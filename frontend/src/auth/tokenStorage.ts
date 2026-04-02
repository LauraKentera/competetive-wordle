const TOKEN_KEY = "token";
const EXPIRY_KEY = "token_expiry";

export function setToken(token: string, expiresInSeconds: number): void {
  const expiresAt = Date.now() + expiresInSeconds * 1000;
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(EXPIRY_KEY, expiresAt.toString());
}

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

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiry();
  if (expiry === null) {
    return true;
  }

  return Date.now() >= expiry;
}

export function getToken(): string | null {
  if (isTokenExpired()) {
    clearToken();
    return null;
  }

  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(EXPIRY_KEY);
}
