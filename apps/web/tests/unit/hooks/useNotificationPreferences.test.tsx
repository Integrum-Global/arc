/**
 * Tests for useNotificationPreferences hook
 */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/useNotificationPreferences";
import { usersApi } from "@/api/endpoints";
import type { NotificationPreferences } from "@/types/api";

// Mock the API endpoints
vi.mock("@/api/endpoints", () => ({
  usersApi: {
    notificationPreferences: vi.fn(),
    updateNotificationPreferences: vi.fn(),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useNotificationPreferences", () => {
  let queryClient: QueryClient;

  const mockPreferences: NotificationPreferences = {
    soundEnabled: true,
    browserNotificationsEnabled: false,
    quietHours: {
      enabled: false,
      start: 1320, // 22:00
      end: 420, // 07:00
    },
    alertTypeSettings: {
      margin_call: {
        enabled: true,
        channels: ["sound", "toast", "email", "badge"],
      },
      position_limit: {
        enabled: true,
        channels: ["sound", "toast", "email", "badge"],
      },
      system_failure: {
        enabled: true,
        channels: ["sound", "toast", "email", "badge"],
      },
      threshold_breach: {
        enabled: true,
        channels: ["toast", "badge"],
      },
      health_issue: {
        enabled: true,
        channels: ["toast", "badge"],
      },
      concentration_warning: {
        enabled: true,
        channels: ["toast", "badge"],
      },
      price_change: {
        enabled: false,
        channels: [],
      },
      ratio_update: {
        enabled: false,
        channels: [],
      },
      performance_milestone: {
        enabled: true,
        channels: ["toast"],
      },
    },
  };

  function createWrapper() {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch notification preferences successfully", async () => {
    vi.mocked(usersApi.notificationPreferences).mockResolvedValue(
      mockPreferences
    );

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPreferences);
    expect(usersApi.notificationPreferences).toHaveBeenCalledOnce();
  });

  it("should handle fetch error", async () => {
    const error = new Error("Network error");
    vi.mocked(usersApi.notificationPreferences).mockRejectedValue(error);

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("should return undefined when no data", () => {
    vi.mocked(usersApi.notificationPreferences).mockResolvedValue(
      mockPreferences
    );

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
  });
});

describe("useUpdateNotificationPreferences", () => {
  let queryClient: QueryClient;

  const mockPreferences: NotificationPreferences = {
    soundEnabled: false,
    browserNotificationsEnabled: true,
    quietHours: {
      enabled: true,
      start: 1320,
      end: 420,
    },
    alertTypeSettings: {
      margin_call: {
        enabled: true,
        channels: ["sound", "toast", "email", "badge"],
      },
    },
  };

  function createWrapper() {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update notification preferences successfully", async () => {
    vi.mocked(usersApi.updateNotificationPreferences).mockResolvedValue(
      mockPreferences
    );

    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ soundEnabled: false });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(usersApi.updateNotificationPreferences).toHaveBeenCalledWith({
      soundEnabled: false,
    });
    expect(result.current.data).toEqual(mockPreferences);
  });

  it("should handle update error", async () => {
    const error = new Error("Update failed");
    vi.mocked(usersApi.updateNotificationPreferences).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ soundEnabled: false });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it("should invalidate preferences cache on success", async () => {
    vi.mocked(usersApi.updateNotificationPreferences).mockResolvedValue(
      mockPreferences
    );

    const { result } = renderHook(() => useUpdateNotificationPreferences(), {
      wrapper: createWrapper(),
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    result.current.mutate({ soundEnabled: false });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["users", "me", "notification-preferences"],
    });
  });
});
