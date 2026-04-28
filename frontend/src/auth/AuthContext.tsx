import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { UserResponse, LoginRequest, RegisterRequest } from "../types/api";
import { authApi } from "../api/authApi";
import { userApi } from "../api/userApi";
import { getToken, setToken, clearToken, isTokenExpired } from "./tokenStorage";
import { isApiError } from "../api/httpClient";

/**
 * Defines the shape of the AuthContext value exposed to consumers.
 * Includes auth state (user, token, loading, error) and action handlers.
 */
interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (credentials: RegisterRequest) => Promise<void>;
  updateUser: (user: UserResponse) => void;
  isLoading: boolean;
  error: string | null;
}

/** React context for authentication state. Undefined until wrapped in AuthProvider. */
const AuthContext = createContext<AuthContextType | undefined>(undefined);


/**
 * Provides authentication state and actions to the component tree.
 * On mount, attempts to restore a previous session from storage if a valid token exists.
 *
 * @param children - Child components that will have access to the auth context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Attempts to restore auth state from a previously stored token.
     * If the token is missing or expired, clears storage and proceeds unauthenticated.
     */
    const initAuth = async () => {
      try {
        const existingToken = getToken();
        if (existingToken && !isTokenExpired()) {
          setTokenState(existingToken);
          const userData = await userApi.getMe();
          setUser(userData);
        } else {
          clearToken();
        }
      } catch (err) {
        const message = isApiError(err) ? err.message : "Failed to initialize auth";
        setError(message);
        clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Logs in the user with the provided credentials.
   * On success, persists the token to storage and fetches the user profile.
   * On failure, sets the error state and re-throws for the caller to handle.
   *
   * @param credentials - The username and password to authenticate with.
   */
  const login = async (credentials: LoginRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await authApi.login(credentials);
      setToken(authResponse.accessToken, authResponse.expiresInSeconds);
      setTokenState(authResponse.accessToken);

      const userData = await userApi.getMe();
      setUser(userData);
    } catch (err) {
      const message = isApiError(err) ? err.message : "Login failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logs out the current user by clearing the token from storage
   * and resetting all auth-related state.
   */
  const logout = (): void => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setError(null);
  };

  /**
   * Registers a new user with the provided credentials.
   * On success, persists the token to storage and fetches the new user's profile.
   * On failure, sets the error state and re-throws for the caller to handle.
   *
   * @param credentials - The username, password, and registration token for the new account.
   */
  const register = async (credentials: RegisterRequest): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const authResponse = await authApi.register(credentials);
      setToken(authResponse.accessToken, authResponse.expiresInSeconds);
      setTokenState(authResponse.accessToken);

      const userData = await userApi.getMe();
      setUser(userData);
    } catch (err) {
      const message = isApiError(err) ? err.message : "Registration failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Replaces the current user object in context with an updated version.
   * Useful for reflecting profile changes without a full re-authentication.
   *
   * @param updatedUser - The updated user data to store in context.
   */
   const updateUser = (updatedUser: UserResponse): void => {
    setUser(updatedUser);
  };


  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, updateUser, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook for consuming the AuthContext.
 * Must be used within a component tree wrapped by AuthProvider.
 *
 * @returns The current AuthContextType value including user state and auth actions.
 * @throws Error if called outside of an AuthProvider.
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
