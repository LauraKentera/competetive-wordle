import { request } from "./httpClient";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegistrationTokenResponse,
} from "../types/api";

export const authApi = {
  login: (credentials: LoginRequest): Promise<AuthResponse> =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getRegistrationToken: (): Promise<RegistrationTokenResponse> =>
    request("/api/auth/registration-token"),

  register: (credentials: RegisterRequest): Promise<AuthResponse> =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};
