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

interface AuthContextType {
  user: UserResponse | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  register: (credentials: RegisterRequest) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: check for existing token and hydrate user
  useEffect(() => {
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

  const logout = (): void => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setError(null);
  };

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

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
