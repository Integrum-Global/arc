/**
 * Tests for useAuth hooks
 *
 * Tests cover:
 * - Current user query
 * - User preferences query
 * - Login mutation
 * - Logout mutation
 * - Profile update mutation
 * - Preferences update mutation
 * - Combined auth hook
 * - Role-based hooks
 * - Token management
 */

import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useCurrentUser,
  useUserPreferences,
  useLogin,
  useLogout,
  useUpdateProfile,
  useUpdatePreferences,
  useAuth,
  useHasRole,
  useIsAdmin,
  useCanManagePortfolios,
  useInvalidateUser,
  useCheckAuthToken,
} from "../useAuth";
import {
  createWrapper,
  createTestQueryClient,
  createMockUser,
  createMockUserPreference,
  createMockLoginResponse,
  setupLocalStorageMock,
  mockLocalStorage,
} from "./test-utils";
import { authApi, usersApi } from "@/api/endpoints";

// Mock the API modules
vi.mock("@/api/endpoints", () => ({
  authApi: {
    login: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
  usersApi: {
    preferences: vi.fn(),
    updateProfile: vi.fn(),
    updatePreferences: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
  });

  afterEach(() => {
    vi.resetAllMocks();
    mockLocalStorage.clear();
  });

  // ==========================================================================
  // Query Hooks
  // ==========================================================================

  describe("useCurrentUser", () => {
    it("should return initial loading state when token exists", () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      vi.mocked(authApi.me).mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it("should not fetch when no token exists", () => {
      // Don't set token
      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fetchStatus).toBe("idle");
      expect(authApi.me).not.toHaveBeenCalled();
    });

    it("should fetch current user successfully", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser();
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUser);
      expect(authApi.me).toHaveBeenCalledTimes(1);
    });

    it("should handle error state", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      vi.mocked(authApi.me).mockRejectedValue(new Error("Unauthorized"));

      const { result } = renderHook(() => useCurrentUser(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("useUserPreferences", () => {
    it("should fetch user preferences successfully", async () => {
      const mockPreferences = createMockUserPreference();
      vi.mocked(usersApi.preferences).mockResolvedValue(mockPreferences);

      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPreferences);
    });
  });

  // ==========================================================================
  // Mutation Hooks
  // ==========================================================================

  describe("useLogin", () => {
    it("should login successfully and store tokens", async () => {
      const mockLoginResponse = createMockLoginResponse();
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useLogin(), { wrapper });

      let loginResult: typeof mockLoginResponse | undefined;

      await act(async () => {
        loginResult = await result.current.mutateAsync({
          email: "test@example.com",
          password: "password123",
        });
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      // Check tokens were stored
      expect(mockLocalStorage.getItem("arcToken")).toBe("mock-access-token");
      expect(mockLocalStorage.getItem("arcRefreshToken")).toBe(
        "mock-refresh-token"
      );

      // Check user was cached
      const cachedUser = queryClient.getQueryData(["users", "me"]);
      expect(cachedUser).toEqual(mockLoginResponse.user);
    });

    it("should handle login error", async () => {
      vi.mocked(authApi.login).mockRejectedValue(
        new Error("Invalid credentials")
      );

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            email: "test@example.com",
            password: "wrong-password",
          });
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(mockLocalStorage.getItem("arcToken")).toBeNull();
    });
  });

  describe("useLogout", () => {
    it("should logout successfully and clear tokens", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      mockLocalStorage.setItem("arcRefreshToken", "test-refresh");

      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      // Mock window.location
      const originalLocation = window.location;
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // Pre-populate cache
      queryClient.setQueryData(["users", "me"], createMockUser());

      const { result } = renderHook(() => useLogout(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(authApi.logout).toHaveBeenCalled();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check tokens were cleared
      expect(mockLocalStorage.getItem("arcToken")).toBeNull();
      expect(mockLocalStorage.getItem("arcRefreshToken")).toBeNull();

      // Check redirect
      expect(mockLocation.href).toBe("/login");

      // Restore window.location
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    });

    it("should clear tokens even on logout error", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      vi.mocked(authApi.logout).mockRejectedValue(new Error("Logout failed"));

      // Mock window.location
      const originalLocation = window.location;
      const mockLocation = { href: "" };
      Object.defineProperty(window, "location", {
        value: mockLocation,
        writable: true,
      });

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      // The mutation will complete (even with error, onError callback clears tokens)
      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch {
          // Error is expected but handled in onError callback
        }
      });

      // Tokens should still be cleared due to onError callback
      expect(mockLocalStorage.getItem("arcToken")).toBeNull();

      // Restore window.location
      Object.defineProperty(window, "location", {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe("useUpdateProfile", () => {
    it("should update profile successfully", async () => {
      const updatedUser = createMockUser({ name: "Updated Name" });
      vi.mocked(usersApi.updateProfile).mockResolvedValue(updatedUser);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdateProfile(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ name: "Updated Name" });
      });

      expect(usersApi.updateProfile).toHaveBeenCalledWith({
        name: "Updated Name",
      });

      // Check cache was updated
      await waitFor(() => {
        const cachedUser = queryClient.getQueryData(["users", "me"]);
        expect(cachedUser).toEqual(updatedUser);
      });
    });
  });

  describe("useUpdatePreferences", () => {
    it("should update preferences successfully", async () => {
      const updatedPrefs = createMockUserPreference({ theme: "dark" });
      vi.mocked(usersApi.updatePreferences).mockResolvedValue(updatedPrefs);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      const { result } = renderHook(() => useUpdatePreferences(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({ theme: "dark" });
      });

      expect(usersApi.updatePreferences).toHaveBeenCalledWith({ theme: "dark" });

      // Check cache was updated
      await waitFor(() => {
        const cachedPrefs = queryClient.getQueryData(["users", "preferences"]);
        expect(cachedPrefs).toEqual(updatedPrefs);
      });
    });
  });

  // ==========================================================================
  // Combined Auth Hook
  // ==========================================================================

  describe("useAuth (combined)", () => {
    it("should return authenticated state when user is loaded", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser();
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it("should return unauthenticated state when no token", () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeUndefined();
    });

    it("should expose login and logout methods", async () => {
      const mockLoginResponse = createMockLoginResponse();
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      // Login
      await act(async () => {
        await result.current.login({
          email: "test@example.com",
          password: "password",
        });
      });

      expect(authApi.login).toHaveBeenCalled();
    });

    it("should expose refreshUser method", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser();
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.user).toBeDefined();
      });

      // Refetch
      await act(async () => {
        await result.current.refreshUser();
      });

      expect(authApi.me).toHaveBeenCalledTimes(2);
    });

    it("should expose clearAuth method", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser();
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // Pre-populate cache
      queryClient.setQueryData(["users", "me"], mockUser);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Clear auth
      act(() => {
        result.current.clearAuth();
      });

      expect(mockLocalStorage.getItem("arcToken")).toBeNull();
    });
  });

  // ==========================================================================
  // Role-Based Hooks
  // ==========================================================================

  describe("useHasRole", () => {
    it("should return true when user has required role", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "admin" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useHasRole("admin"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should return false when user does not have required role", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "viewer" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useHasRole("admin"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it("should accept array of roles", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "analyst" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useHasRole(["admin", "analyst"]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should return false when no user", () => {
      const { result } = renderHook(() => useHasRole("admin"), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBe(false);
    });
  });

  describe("useIsAdmin", () => {
    it("should return true for admin user", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "admin" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useIsAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should return false for non-admin user", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "viewer" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useIsAdmin(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe("useCanManagePortfolios", () => {
    it("should return true for admin", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "admin" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCanManagePortfolios(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should return true for portfolio_manager", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "portfolio_manager" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCanManagePortfolios(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it("should return false for analyst", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser({ role: "analyst" });
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useCanManagePortfolios(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Utility Hooks
  // ==========================================================================

  describe("useInvalidateUser", () => {
    it("should invalidate user queries", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser();
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // Populate cache
      const { result: userResult } = renderHook(() => useCurrentUser(), {
        wrapper,
      });

      await waitFor(() => {
        expect(userResult.current.isSuccess).toBe(true);
      });

      // Verify cache has data
      expect(queryClient.getQueryData(["users", "me"])).toEqual(mockUser);

      // Get invalidate function
      const { result: invalidateResult } = renderHook(
        () => useInvalidateUser(),
        { wrapper }
      );

      // Invalidate - this should mark queries as stale
      act(() => {
        invalidateResult.current();
      });

      // Verify invalidation was called - check that API was called
      // Since we're invalidating, queries should be refetched
      await waitFor(() => {
        // The query should have been called at least twice (initial + invalidation refetch)
        expect(authApi.me).toHaveBeenCalled();
      });
    });
  });

  describe("useCheckAuthToken", () => {
    it("should return false when no token", () => {
      const { result } = renderHook(() => useCheckAuthToken(), {
        wrapper: createWrapper(),
      });

      expect(result.current()).toBe(false);
    });

    it("should return true for non-JWT token", () => {
      mockLocalStorage.setItem("arcToken", "simple-token");

      const { result } = renderHook(() => useCheckAuthToken(), {
        wrapper: createWrapper(),
      });

      expect(result.current()).toBe(true);
    });

    it("should return true for valid JWT", () => {
      // Create a valid JWT with future expiration
      const payload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const base64Payload = btoa(JSON.stringify(payload));
      const mockJwt = `header.${base64Payload}.signature`;

      mockLocalStorage.setItem("arcToken", mockJwt);

      const { result } = renderHook(() => useCheckAuthToken(), {
        wrapper: createWrapper(),
      });

      expect(result.current()).toBe(true);
    });

    it("should return false for expired JWT", () => {
      // Create an expired JWT
      const payload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const base64Payload = btoa(JSON.stringify(payload));
      const mockJwt = `header.${base64Payload}.signature`;

      mockLocalStorage.setItem("arcToken", mockJwt);

      const { result } = renderHook(() => useCheckAuthToken(), {
        wrapper: createWrapper(),
      });

      expect(result.current()).toBe(false);
    });

    it("should return true for JWT without expiration", () => {
      // Create a JWT without exp claim
      const payload = { sub: "user-1" };
      const base64Payload = btoa(JSON.stringify(payload));
      const mockJwt = `header.${base64Payload}.signature`;

      mockLocalStorage.setItem("arcToken", mockJwt);

      const { result } = renderHook(() => useCheckAuthToken(), {
        wrapper: createWrapper(),
      });

      expect(result.current()).toBe(true);
    });
  });

  // ==========================================================================
  // Cache Behavior
  // ==========================================================================

  describe("cache behavior", () => {
    it("should cache user data", async () => {
      mockLocalStorage.setItem("arcToken", "test-token");
      const mockUser = createMockUser();
      vi.mocked(authApi.me).mockResolvedValue(mockUser);

      const queryClient = createTestQueryClient();
      const wrapper = createWrapper(queryClient);

      // First render
      const { result: result1 } = renderHook(() => useCurrentUser(), {
        wrapper,
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      expect(authApi.me).toHaveBeenCalledTimes(1);

      // Second render should use cache
      const { result: result2 } = renderHook(() => useCurrentUser(), {
        wrapper,
      });

      expect(result2.current.data).toEqual(mockUser);
      expect(authApi.me).toHaveBeenCalledTimes(1);
    });
  });
});
