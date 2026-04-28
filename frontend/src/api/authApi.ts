import { request } from "./httpClient";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegistrationTokenResponse,
} from "../types/api";

/**
 * API client for authentication endpoints.
 * Handles login, registration token retrieval, and user registration.
 */
export const authApi = {
  /**
   * Authenticates a user with username and password.
   * POST /api/auth/login
   *
   * @param credentials - The user's login credentials.
   * @returns A promise resolving to an AuthResponse containing the JWT token.
   */
  login: (credentials: LoginRequest): Promise<AuthResponse> =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  /**
   * Fetches a one-time registration token required for account creation.
   * GET /api/auth/registration-token
   *
   * @returns A promise resolving to a RegistrationTokenResponse.
   */
  getRegistrationToken: (): Promise<RegistrationTokenResponse> =>
    request("/api/auth/registration-token"),

  /**
   * Registers a new user account.
   * POST /api/auth/register
   *
   * @param credentials - The registration details including username, password, and token.
   * @returns A promise resolving to an AuthResponse containing the JWT token.
   */
  register: (credentials: RegisterRequest): Promise<AuthResponse> =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};
