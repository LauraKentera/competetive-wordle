import { request } from "./httpClient";
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegistrationTokenResponse,
} from "../types/api";

export const authApi = {
  login: (credentials: LoginRequest): Promise<AuthResponse> =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),

  getRegistrationToken: (): Promise<RegistrationTokenResponse> =>
    request("/auth/registration-token", {
      method: "POST",
    }),

  register: (credentials: RegisterRequest): Promise<AuthResponse> =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(credentials),
    }),
};
