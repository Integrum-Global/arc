/**
 * Unit Tests for useDashboardSync Hook
 * Tests React Query integration for dashboard layout synchronization
 * TDD approach - tests written before implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock API endpoints - must be hoisted before imports
vi.mock("@/api/endpoints", () => ({
  dashboardApi: {
    getActiveLayout: vi.fn(),
    getAllLayouts: vi.fn(),
    updateLayout: vi.fn(),
    createLayout: vi.fn(),
    deleteLayout: vi.fn(),
    activateLayout: vi.fn(),
  },
}));

// Mock toast notifications
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Import after mocks are set up
import { dashboardApi } from "@/api/endpoints";
import { useDashboardSync, useSaveLayout, useLoadLayout } from "@/hooks/useDashboardSync";
import {
  useDashboardStore,
  DEFAULT_WIDGETS,
  type WidgetInstance,
} from "@/stores/dashboardStore";
import { toast } from "sonner";

// Type assertion for mocked API
const mockDashboardApi = dashboardApi as {
  getActiveLayout: ReturnType<typeof vi.fn>;
  getAllLayouts: ReturnType<typeof vi.fn>;
  updateLayout: ReturnType<typeof vi.fn>;
  createLayout: ReturnType<typeof vi.fn>;
  deleteLayout: ReturnType<typeof vi.fn>;
  activateLayout: ReturnType<typeof vi.fn>;
};

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Mock layout data
const mockActiveLayout = {
  id: "layout-123",
  name: "Default",
  widgets: [
    {
      id: "inst-1",
      widgetId: "summary-cards",
      position: { x: 0, y: 0 },
      size: { cols: 4, rows: 1 },
    },
    {
      id: "inst-2",
      widgetId: "allocation-chart",
      position: { x: 0, y: 1 },
      size: { cols: 2, rows: 2 },
      settings: { chartType: "pie", showLegend: true },
    },
  ] as WidgetInstance[],
  isDefault: true,
  createdAt: "2025-01-15T10:00:00Z",
  updatedAt: "2025-01-15T12:00:00Z",
};

describe("useDashboardSync", () => {
  beforeEach(() => {
    // Clear localStorage
    localStorageMock.clear();
    vi.clearAllMocks();

    // Reset store to initial state
    useDashboardStore.setState({
      widgets: [...DEFAULT_WIDGETS],
      isEditMode: false,
      selectedWidgetId: null,
      isSyncing: false,
      lastSyncedAt: null,
      hasUnsavedChanges: false,
    });

    // Setup default mock responses
    mockDashboardApi.getActiveLayout.mockResolvedValue(mockActiveLayout);
    mockDashboardApi.updateLayout.mockResolvedValue(mockActiveLayout);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Load", () => {
    it("fetches active layout on mount", async () => {
      const wrapper = createWrapper();
      renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        expect(mockDashboardApi.getActiveLayout).toHaveBeenCalledTimes(1);
      });
    });

    it("returns loading state while fetching", () => {
      mockDashboardApi.getActiveLayout.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it("returns loaded state after fetch completes", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("updates store with loaded layout", async () => {
      const wrapper = createWrapper();
      renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        const { widgets } = useDashboardStore.getState();
        expect(widgets).toEqual(mockActiveLayout.widgets);
      });
    });

    it("marks as synced after loading layout", async () => {
      const wrapper = createWrapper();
      renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        const { hasUnsavedChanges } = useDashboardStore.getState();
        expect(hasUnsavedChanges).toBe(false);
      });
    });

    it("stores active layout ID", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.activeLayoutId).toBe("layout-123");
      });
    });
  });

  describe("Save Layout", () => {
    it("provides saveLayout function", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        expect(typeof result.current.saveLayout).toBe("function");
      });
    });

    it("calls API to update layout on save", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save layout
      await act(async () => {
        await result.current.saveLayout();
      });

      expect(mockDashboardApi.updateLayout).toHaveBeenCalled();
    });

    it("sends current widgets to API on save", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Get current widgets from store
      const { widgets } = useDashboardStore.getState();

      // Save layout
      await act(async () => {
        await result.current.saveLayout();
      });

      expect(mockDashboardApi.updateLayout).toHaveBeenCalledWith(
        "layout-123",
        expect.objectContaining({ widgets })
      );
    });

    it("marks as synced after successful save", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Make a change to trigger hasUnsavedChanges
      useDashboardStore.getState().addWidget("health-score");

      // Verify unsaved changes
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);

      // Save layout
      await act(async () => {
        await result.current.saveLayout();
      });

      await waitFor(() => {
        expect(useDashboardStore.getState().hasUnsavedChanges).toBe(false);
      });
    });

    it("tracks isSaving state during save operation", async () => {
      // Using a deferred promise to control timing
      let resolveUpdate!: (value: typeof mockActiveLayout) => void;
      const updatePromise = new Promise<typeof mockActiveLayout>((resolve) => {
        resolveUpdate = resolve;
      });
      mockDashboardApi.updateLayout.mockReturnValue(updatePromise);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Initially not saving
      expect(result.current.isSaving).toBe(false);

      // Start save - this kicks off the mutation
      act(() => {
        result.current.saveLayout();
      });

      // Should now be saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      // Resolve the save operation
      await act(async () => {
        resolveUpdate(mockActiveLayout);
      });

      // Should no longer be saving
      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });

    it("shows success toast on successful save", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Save layout
      await act(async () => {
        await result.current.saveLayout();
      });

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Layout"),
        expect.any(Object)
      );
    });
  });

  describe("Error Handling", () => {
    it("handles load error gracefully", async () => {
      mockDashboardApi.getActiveLayout.mockRejectedValue(new Error("Network error"));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.loadError).toBeDefined();
    });

    it("keeps default widgets on load error", async () => {
      mockDashboardApi.getActiveLayout.mockRejectedValue(new Error("Network error"));

      const wrapper = createWrapper();
      renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        const { widgets } = useDashboardStore.getState();
        expect(widgets).toEqual(DEFAULT_WIDGETS);
      });
    });

    it("handles save error gracefully", async () => {
      mockDashboardApi.updateLayout.mockRejectedValue(new Error("Save failed"));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Attempt save (catch expected error)
      await act(async () => {
        try {
          await result.current.saveLayout();
        } catch {
          // Expected error
        }
      });

      expect(result.current.saveError).toBeDefined();
    });

    it("shows error toast on save failure", async () => {
      mockDashboardApi.updateLayout.mockRejectedValue(new Error("Save failed"));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Attempt save (catch expected error)
      await act(async () => {
        try {
          await result.current.saveLayout();
        } catch {
          // Expected error
        }
      });

      expect(toast.error).toHaveBeenCalled();
    });

    it("does not clear hasUnsavedChanges on save error", async () => {
      mockDashboardApi.updateLayout.mockRejectedValue(new Error("Save failed"));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Make a change to trigger hasUnsavedChanges
      useDashboardStore.getState().addWidget("health-score");
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);

      // Attempt save (catch expected error)
      await act(async () => {
        try {
          await result.current.saveLayout();
        } catch {
          // Expected error
        }
      });

      // hasUnsavedChanges should still be true since save failed
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(true);
    });
  });

  describe("hasUnsavedChanges Integration", () => {
    it("returns hasUnsavedChanges from store", async () => {
      const wrapper = createWrapper();
      const { result } = renderHook(() => useDashboardSync(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasUnsavedChanges).toBe(false);

      // Make a change
      act(() => {
        useDashboardStore.getState().addWidget("health-score");
      });

      expect(result.current.hasUnsavedChanges).toBe(true);
    });
  });

  describe("Stale Time Configuration", () => {
    it("uses 5 minute stale time for layout query", async () => {
      // This test verifies that multiple calls within stale time don't refetch
      const wrapper = createWrapper();

      // First render
      const { unmount } = renderHook(() => useDashboardSync(), { wrapper });

      await waitFor(() => {
        expect(mockDashboardApi.getActiveLayout).toHaveBeenCalledTimes(1);
      });

      unmount();

      // Second render should use cached data
      renderHook(() => useDashboardSync(), { wrapper });

      // Should still only have been called once (cached)
      expect(mockDashboardApi.getActiveLayout).toHaveBeenCalledTimes(1);
    });
  });
});

describe("useSaveLayout", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();

    useDashboardStore.setState({
      widgets: [...DEFAULT_WIDGETS],
      isEditMode: false,
      selectedWidgetId: null,
      isSyncing: false,
      lastSyncedAt: null,
      hasUnsavedChanges: false,
    });

    mockDashboardApi.updateLayout.mockResolvedValue(mockActiveLayout);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("provides mutate function", () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSaveLayout(), { wrapper });

    expect(typeof result.current.mutate).toBe("function");
  });

  it("calls updateLayout with provided layout ID and widgets", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSaveLayout(), { wrapper });

    const testWidgets: WidgetInstance[] = [
      {
        id: "test-1",
        widgetId: "summary-cards",
        position: { x: 0, y: 0 },
        size: { cols: 4, rows: 1 },
      },
    ];

    await act(async () => {
      result.current.mutate({ layoutId: "layout-456", widgets: testWidgets });
    });

    await waitFor(() => {
      expect(mockDashboardApi.updateLayout).toHaveBeenCalledWith("layout-456", {
        widgets: testWidgets,
      });
    });
  });

  it("marks store as synced on success", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSaveLayout(), { wrapper });

    // Mark as having unsaved changes
    useDashboardStore.setState({ hasUnsavedChanges: true });

    await act(async () => {
      result.current.mutate({
        layoutId: "layout-456",
        widgets: [...DEFAULT_WIDGETS],
      });
    });

    await waitFor(() => {
      expect(useDashboardStore.getState().hasUnsavedChanges).toBe(false);
    });
  });
});

describe("useLoadLayout", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();

    useDashboardStore.setState({
      widgets: [...DEFAULT_WIDGETS],
      isEditMode: false,
      selectedWidgetId: null,
      isSyncing: false,
      lastSyncedAt: null,
      hasUnsavedChanges: false,
    });

    mockDashboardApi.getActiveLayout.mockResolvedValue(mockActiveLayout);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns active layout data", async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLoadLayout(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockActiveLayout);
    });
  });

  it("returns loading state", () => {
    mockDashboardApi.getActiveLayout.mockImplementation(() => new Promise(() => {}));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLoadLayout(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it("returns error on failure", async () => {
    mockDashboardApi.getActiveLayout.mockRejectedValue(new Error("Load failed"));

    const wrapper = createWrapper();
    const { result } = renderHook(() => useLoadLayout(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBeDefined();
    });
  });
});
