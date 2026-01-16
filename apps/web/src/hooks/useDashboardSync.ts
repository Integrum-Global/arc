/**
 * Dashboard Sync Hooks
 * React Query hooks for syncing dashboard layouts with backend
 * Provides load, save, and sync functionality for dashboard customization
 */

import { useEffect, useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  dashboardApi,
  type DashboardLayout,
  type UpdateDashboardLayoutRequest,
} from "@/api/endpoints";
import { createMutationErrorHandler, shouldRetryQuery } from "@/api/errors";
import { queryKeys } from "@/lib/queryKeys";
import {
  useDashboardStore,
  useWidgets,
  useHasUnsavedChanges,
  type WidgetInstance,
} from "@/stores/dashboardStore";
import { toast } from "sonner";

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to load the active dashboard layout from backend
 * Use this for initial page load or manual refresh
 */
export function useLoadLayout(
  options?: Omit<UseQueryOptions<DashboardLayout>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.dashboard.activeLayout(),
    queryFn: () => dashboardApi.getActiveLayout(),
    retry: shouldRetryQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes - layout doesn't change frequently
    ...options,
  });
}

/**
 * Hook to load all dashboard layouts for current user
 */
export function useAllLayouts(
  options?: Omit<UseQueryOptions<DashboardLayout[]>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.dashboard.layouts(),
    queryFn: () => dashboardApi.getAllLayouts(),
    retry: shouldRetryQuery,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to save dashboard layout to backend
 * Marks store as synced on success
 */
export function useSaveLayout() {
  const queryClient = useQueryClient();
  const markAsSynced = useDashboardStore((state) => state.markAsSynced);

  return useMutation({
    mutationFn: ({
      layoutId,
      widgets,
    }: {
      layoutId: string;
      widgets: WidgetInstance[];
    }) =>
      dashboardApi.updateLayout(layoutId, {
        widgets,
      } as UpdateDashboardLayoutRequest),
    onSuccess: (layout) => {
      // Update cache with new layout data
      queryClient.setQueryData(queryKeys.dashboard.activeLayout(), layout);
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.layouts(),
      });

      // Mark store as synced
      markAsSynced();

      toast.success("Layout saved", {
        description: "Your dashboard layout has been saved.",
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to save layout",
    }),
  });
}

/**
 * Hook to create a new dashboard layout
 */
export function useCreateLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; widgets: WidgetInstance[] }) =>
      dashboardApi.createLayout({
        name: data.name,
        widgets: data.widgets,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.layouts(),
      });
      toast.success("Layout created", {
        description: "Your new dashboard layout has been created.",
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to create layout",
    }),
  });
}

/**
 * Hook to delete a dashboard layout
 */
export function useDeleteLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (layoutId: string) => dashboardApi.deleteLayout(layoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.layouts(),
      });
      toast.success("Layout deleted", {
        description: "The dashboard layout has been deleted.",
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to delete layout",
    }),
  });
}

/**
 * Hook to activate a dashboard layout
 */
export function useActivateLayout() {
  const queryClient = useQueryClient();
  const loadLayout = useDashboardStore((state) => state.loadLayout);

  return useMutation({
    mutationFn: (layoutId: string) => dashboardApi.activateLayout(layoutId),
    onSuccess: (layout) => {
      // Update active layout cache
      queryClient.setQueryData(queryKeys.dashboard.activeLayout(), layout);

      // Load the layout into the store
      loadLayout(layout.widgets as WidgetInstance[]);

      toast.success("Layout activated", {
        description: `Switched to "${layout.name}" layout.`,
      });
    },
    onError: createMutationErrorHandler({
      title: "Failed to activate layout",
    }),
  });
}

// =============================================================================
// Combined Sync Hook
// =============================================================================

/**
 * Main dashboard sync hook that combines loading and saving
 * Automatically loads layout on mount and provides save functionality
 *
 * @example
 * ```tsx
 * function DashboardPage() {
 *   const {
 *     isLoading,
 *     isSaving,
 *     hasUnsavedChanges,
 *     saveLayout,
 *     loadError,
 *     saveError,
 *     activeLayoutId,
 *   } = useDashboardSync();
 *
 *   if (isLoading) return <DashboardSkeleton />;
 *
 *   return (
 *     <div>
 *       <DashboardHeader
 *         onSave={saveLayout}
 *         isSaving={isSaving}
 *         hasUnsavedChanges={hasUnsavedChanges}
 *       />
 *       <DashboardGrid />
 *     </div>
 *   );
 * }
 * ```
 */
export function useDashboardSync() {
  const loadLayoutToStore = useDashboardStore((state) => state.loadLayout);
  const markAsSynced = useDashboardStore((state) => state.markAsSynced);
  const widgets = useWidgets();
  const hasUnsavedChanges = useHasUnsavedChanges();

  // Load active layout from backend
  const {
    data: activeLayout,
    isLoading,
    error: loadError,
  } = useLoadLayout();

  // Save layout mutation
  const saveMutation = useSaveLayout();

  // Apply loaded layout to store when data arrives
  useEffect(() => {
    if (activeLayout?.widgets && activeLayout.widgets.length > 0) {
      loadLayoutToStore(activeLayout.widgets as WidgetInstance[]);
      markAsSynced();
    }
  }, [activeLayout, loadLayoutToStore, markAsSynced]);

  // Save current layout to backend
  const saveLayout = useCallback(async () => {
    if (!activeLayout?.id) {
      console.warn("No active layout ID available for saving");
      return;
    }

    await saveMutation.mutateAsync({
      layoutId: activeLayout.id,
      widgets,
    });
  }, [activeLayout, widgets, saveMutation]);

  return {
    // Loading state
    isLoading,
    loadError,

    // Saving state
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,

    // Data
    activeLayoutId: activeLayout?.id ?? null,
    activeLayoutName: activeLayout?.name ?? null,

    // Sync state from store
    hasUnsavedChanges,

    // Actions
    saveLayout,
  };
}

// =============================================================================
// Utility Hooks
// =============================================================================

/**
 * Hook to invalidate all dashboard layout caches
 */
export function useInvalidateDashboardLayouts() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.layouts() });
    queryClient.invalidateQueries({
      queryKey: queryKeys.dashboard.activeLayout(),
    });
  }, [queryClient]);
}

/**
 * Hook to prefetch a dashboard layout
 */
export function usePrefetchLayout() {
  const queryClient = useQueryClient();

  return useCallback(
    (layoutId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard.layout(layoutId),
        queryFn: () => dashboardApi.getAllLayouts().then(
          (layouts) => layouts.find((l) => l.id === layoutId)
        ),
        staleTime: 30 * 1000, // Consider fresh for 30 seconds
      });
    },
    [queryClient]
  );
}
