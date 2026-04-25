import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import * as authApi from "../api/authApi";
import * as userApi from "../api/userApi";
import * as tokenStorage from "./tokenStorage";

jest.mock("../api/authApi");
jest.mock("../api/userApi");
jest.mock("./tokenStorage");

const mockAuthResponse = {
  accessToken: "test-token",
  tokenType: "Bearer",
  expiresInSeconds: 3600,
  username: "testuser",
  role: "USER" as const,
};

const mockUserResponse = {
  id: 1,
  username: "testuser",
  role: "USER" as const,
  status: "ONLINE" as const,
  lastLogin: "2026-04-03T12:00:00Z",
  avatarId: 1,
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  gamesDrawn: 0,
  gamesForfeited: 0,
};

// Test component that uses the hook
function TestComponent() {
  const { user, token, login, logout, register, isLoading, error } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? "LOADING" : "READY"}</div>
      <div data-testid="token">{token || "NO_TOKEN"}</div>
      <div data-testid="user">{user?.username || "NO_USER"}</div>
      <div data-testid="error">{error || "NO_ERROR"}</div>

      <button
        onClick={() => login({ username: "test", password: "pass" })}
        data-testid="login-btn"
      >
        Login
      </button>
      <button
        onClick={() =>
          register({
            username: "newuser",
            password: "pass",
            registrationToken: "token",
          })
        }
        data-testid="register-btn"
      >
        Register
      </button>
      <button onClick={() => logout()} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (tokenStorage.getToken as jest.Mock).mockReturnValue(null);
    (tokenStorage.isTokenExpired as jest.Mock).mockReturnValue(true);
  });

  it("initializes with no user or token", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("READY");
    });

    expect(screen.getByTestId("token")).toHaveTextContent("NO_TOKEN");
    expect(screen.getByTestId("user")).toHaveTextContent("NO_USER");
  });

  it("hydrates user if valid token exists in storage", async () => {
    (tokenStorage.getToken as jest.Mock).mockReturnValue("existing-token");
    (tokenStorage.isTokenExpired as jest.Mock).mockReturnValue(false);
    (userApi.userApi.getMe as jest.Mock).mockResolvedValue(mockUserResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    expect(screen.getByTestId("token")).toHaveTextContent("existing-token");
  });

  it("clears token if expired on mount", async () => {
    (tokenStorage.getToken as jest.Mock).mockReturnValue("expired-token");
    (tokenStorage.isTokenExpired as jest.Mock).mockReturnValue(true);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("READY");
    });

    expect(tokenStorage.clearToken).toHaveBeenCalled();
    expect(screen.getByTestId("token")).toHaveTextContent("NO_TOKEN");
  });

  it("logs in successfully", async () => {
    (authApi.authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse);
    (userApi.userApi.getMe as jest.Mock).mockResolvedValue(mockUserResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("READY");
    });

    await userEvent.click(screen.getByTestId("login-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    expect(tokenStorage.setToken).toHaveBeenCalledWith(
      "test-token",
      3600
    );
    expect(screen.getByTestId("token")).toHaveTextContent("test-token");
  });

  it("registers successfully", async () => {
    (authApi.authApi.register as jest.Mock).mockResolvedValue(
      mockAuthResponse
    );
    (userApi.userApi.getMe as jest.Mock).mockResolvedValue(mockUserResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("READY");
    });

    await userEvent.click(screen.getByTestId("register-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    expect(tokenStorage.setToken).toHaveBeenCalledWith(
      "test-token",
      3600
    );
    expect(screen.getByTestId("token")).toHaveTextContent("test-token");
  });

  it("logs out and clears state", async () => {
    (authApi.authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse);
    (userApi.userApi.getMe as jest.Mock).mockResolvedValue(mockUserResponse);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("READY");
    });

    await userEvent.click(screen.getByTestId("login-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    await userEvent.click(screen.getByTestId("logout-btn"));

    expect(tokenStorage.clearToken).toHaveBeenCalled();
    expect(screen.getByTestId("token")).toHaveTextContent("NO_TOKEN");
    expect(screen.getByTestId("user")).toHaveTextContent("NO_USER");
  });
});
