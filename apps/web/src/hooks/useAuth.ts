/**
 * Auth Hooks
 * React Query hooks for authentication and user management
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { authApi, usersApi } from "@/api/endpoints";
import {
  createMutationErrorHandler,
  shouldRetryQuery,
  ApiError,
  ApiErrorCode,
} from "@/api/errors";
import { queryKeys } from "@/lib/queryKeys";
import type {
  User,
  UserPreference,
  LoginCredentials,
  LoginResponse,
  UpdateUserProfileRequest,
  UpdateUserPreferencesRequest,
} from "@/types/api";
import { toast } from "sonner";
import { useCallback, useMemo } from "react";

// =============================================================================
// Constants
// =============================================================================

const AUTH_TOKEN_KEY = "arcToken";
const REFRESH_TOKEN_KEY = "arcRefreshToken";

// =============================================================================
// Token Management
// =============================================================================

/**
 * Get the current access token from storage
 */
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * Set the access token in storage
 */
function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Set the refresh token in storage
 */
function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Clear all auth tokens from storage
 */
function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch current user profile
 */
export function useCurrentUser(
  options?: Omit<UseQueryOptions<User>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.users.me(),
    queryFn: () => authApi.me(),
    retry: (failureCount, error) => {
      // Don't retry auth errors
      if (
        error instanceof ApiError &&
        error.code === ApiErrorCode.UNAUTHORIZED
      ) {
        return false;
      }
      return shouldRetryQuery(failureCount, error as Error);
    },
    // Only fetch if we have a token
    enabled:
      typeof window !== "undefined" && !!localStorage.getItem(AUTH_TOKEN_KEY),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch user preferences
 */
export function useUserPreferences(
  options?: Omit<UseQueryOptions<UserPreference>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.users.preferences(),
    queryFn: () => usersApi.preferences(),
    retry: shouldRetryQuery,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (response: LoginResponse) => {
      // Store tokens
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);

      // Cache the user data
      queryClient.setQueryData(queryKeys.users.me(), response.user);

      toast.success("Welcome back!", {
        description: `Logged in as ${response.user.name}`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Login failed",
    }),
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear tokens
      clearTokens();

      // Clear all cached data
      queryClient.clear();

      toast.success("Logged out", {
        description: "You have been logged out successfully.",
      });

      // Redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
    onError: (error) => {
      // Even if logout API fails, clear local state
      clearTokens();
      queryClient.clear();

      console.error("Logout error:", error);

      // Redirect anyway
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserProfileRequest) =>
      usersApi.updateProfile(data),
    onSuccess: (user) => {
      // Update user in cache
      queryClient.setQueryData(queryKeys.users.me(), user);

      toast.success("Profile updated", {
        description: "Your profile has been updated successfully.",
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to update profile",
    }),
  });
}

/**
 * Hook to update user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserPreferencesRequest) =>
      usersApi.updatePreferences(data),
    onSuccess: (preferences) => {
      // Update preferences in cache
      queryClient.setQueryData(queryKeys.users.preferences(), preferences);

      toast.success("Preferences updated", {
        description: "Your preferences have been updated successfully.",
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to update preferences",
    }),
  });
}

// =============================================================================
// Combined Auth Hook
// =============================================================================

/**
 * Combined auth hook that provides auth state and methods
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const isAuthenticated = useMemo(() => {
    return !!user && !!getAccessToken();
  }, [user]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      return loginMutation.mutateAsync(credentials);
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refreshUser = useCallback(() => {
    return refetch();
  }, [refetch]);

  const clearAuth = useCallback(() => {
    clearTokens();
    queryClient.removeQueries({ queryKey: queryKeys.users.me() });
  }, [queryClient]);

  return {
    // State
    user,
    isLoading,
    error,
    isAuthenticated,

    // Auth status
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,

    // Methods
    login,
    logout,
    refreshUser,
    clearAuth,
  };
}

// =============================================================================
// Auth Guard Hook
// =============================================================================

/**
 * Hook to check if user has specific role
 */
export function useHasRole(requiredRole: User["role"] | User["role"][]) {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(user.role);
  }, [user, requiredRole]);
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  return useHasRole("admin");
}

/**
 * Hook to check if user can manage portfolios
 */
export function useCanManagePortfolios() {
  return useHasRole(["admin", "portfolio_manager"]);
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to invalidate user-related queries
 */
export function useInvalidateUser() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  };
}

/**
 * Hook to check auth token validity
 */
export function useCheckAuthToken() {
  return useCallback(() => {
    const token = getAccessToken();
    if (!token) return false;

    // Basic JWT expiration check (if token is JWT)
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return true; // Not a JWT, assume valid

      const tokenPayload = parts[1];
      if (!tokenPayload) return true; // Invalid token structure
      const payload = JSON.parse(atob(tokenPayload));
      if (payload.exp) {
        const expirationTime = payload.exp * 1000;
        return Date.now() < expirationTime;
      }
      return true;
    } catch {
      return true; // Can't parse, assume valid
    }
  }, []);
}
