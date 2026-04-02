import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { setToken, getToken, clearToken, getTokenExpiry, isTokenExpired } from "./tokenStorage";

describe("tokenStorage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("stores token and expiry in sessionStorage", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    setToken("abc", 60);

    expect(sessionStorage.getItem("token")).toBe("abc");
    expect(Number(sessionStorage.getItem("token_expiry"))).toBe(now + 60_000);
  });

  it("returns token when not expired", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    setToken("abc", 60);

    jest.spyOn(Date, "now").mockReturnValue(now + 30_000);

    expect(getToken()).toBe("abc");
    expect(isTokenExpired()).toBe(false);
    expect(getTokenExpiry()).toBe(now + 60_000);
  });

  it("returns null and clears token when expired", () => {
    const now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockReturnValue(now);

    setToken("abc", 1);

    jest.spyOn(Date, "now").mockReturnValue(now + 2_000);

    expect(isTokenExpired()).toBe(true);
    expect(getToken()).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token_expiry")).toBeNull();
  });

  it("clearToken removes token and expiry", () => {
    setToken("abc", 60);

    clearToken();

    expect(sessionStorage.getItem("token")).toBeNull();
    expect(sessionStorage.getItem("token_expiry")).toBeNull();
  });

  it("getTokenExpiry returns null when no expiry or invalid expiry", () => {
    clearToken();
    expect(getTokenExpiry()).toBeNull();

    sessionStorage.setItem("token_expiry", "not-a-number");
    expect(getTokenExpiry()).toBeNull();
  });
});
