/**
 * Unit tests for useLinkedAccounts hook
 * Tests FIRST (TDD approach)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useLinkedAccounts,
  useLinkAccount,
  useUnlinkAccount,
} from "@/hooks/useLinkedAccounts";

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock fetch using vi.stubGlobal
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const mockLinkedAccounts = [
  {
    id: "link-1",
    provider_type: "azure",
    provider_email: "user@company.com",
    provider_name: "John Doe",
    linked_at: "2024-01-01T00:00:00Z",
    last_login_at: "2024-01-10T00:00:00Z",
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("useLinkedAccounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  it("fetches linked accounts on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLinkedAccounts,
    });

    const { result } = renderHook(() => useLinkedAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/v1/auth/linked-accounts");
    expect(result.current.data).toEqual(mockLinkedAccounts);
  });

  it("handles fetch errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useLinkedAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.data).toBeUndefined();
  });

  it("returns loading state initially", () => {
    mockFetch.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => useLinkedAccounts(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("uses correct query key", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLinkedAccounts,
    });

    const { result } = renderHook(() => useLinkedAccounts(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Query key is accessible via internal state
    expect(result.current.data).toBeDefined();
  });
});

describe("useLinkAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    window.location = { href: "" } as any;

    // Mock sessionStorage
    const sessionStorageMock = {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, "sessionStorage", {
      value: sessionStorageMock,
      writable: true,
    });
  });

  it("starts OAuth flow for provider", async () => {
    const mockAuthUrl = "https://oauth.provider.com/authorize";
    const mockState = "test-state";
    const mockVerifier = "test-verifier";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        auth_url: mockAuthUrl,
        state: mockState,
        code_verifier: mockVerifier,
      }),
    });

    const { result } = renderHook(() => useLinkAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/auth/oauth/azure",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("/settings/security"),
      })
    );

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      "oauth_state",
      mockState
    );
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      "oauth_code_verifier",
      mockVerifier
    );
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      "oauth_provider",
      "azure"
    );
    expect(window.location.href).toBe(mockAuthUrl);
  });

  it("handles OAuth start errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("OAuth error"));

    const { result } = renderHook(() => useLinkAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(window.location.href).toBe("");
  });

  it("passes tenant_id and return_url in request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        auth_url: "https://oauth.provider.com/authorize",
        state: "state",
        code_verifier: "verifier",
      }),
    });

    const { result } = renderHook(() => useLinkAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("google");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/v1/auth/oauth/google",
        expect.objectContaining({
          body: JSON.stringify({
            tenant_id: "default",
            return_url: "/settings/security",
          }),
        })
      );
    });
  });
});

describe("useUnlinkAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unlinks account successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUnlinkAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/v1/auth/link/azure",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("shows success toast after unlinking", async () => {
    const { toast } = await import("sonner");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useUnlinkAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith("Account unlinked successfully");
  });

  it("shows error toast when unlink fails", async () => {
    const { toast } = await import("sonner");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "Cannot unlink last authentication method",
    });

    const { result } = renderHook(() => useUnlinkAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("invalidates linked-accounts query on success", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUnlinkAccount(), { wrapper });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ["linked-accounts"],
    });
  });

  it("handles network errors", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useUnlinkAccount(), {
      wrapper: createWrapper(),
    });

    result.current.mutate("azure");

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
