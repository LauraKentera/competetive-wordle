import { request } from "./httpClient";
import { UserResponse } from "../types/api";

export const userApi = {
  getMe: (): Promise<UserResponse> => request("/api/me"),
  getUserById: (id: number): Promise<UserResponse> => request(`/api/users/${id}`),
};
