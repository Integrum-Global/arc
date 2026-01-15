/**
 * Notification Preferences Hooks
 * React Query hooks for managing notification settings
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { usersApi } from "@/api/endpoints";
import {
  createMutationErrorHandler,
  shouldRetryQuery,
} from "@/api/errors";
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
} from "@/types/api";
import { toast } from "sonner";

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferences(
  options?: Omit<
    UseQueryOptions<NotificationPreferences>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: ["users", "me", "notification-preferences"],
    queryFn: () => usersApi.notificationPreferences(),
    retry: shouldRetryQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Hook to update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateNotificationPreferencesRequest) =>
      usersApi.updateNotificationPreferences(data),
    onSuccess: (data) => {
      // Invalidate preferences cache to refetch
      queryClient.invalidateQueries({
        queryKey: ["users", "me", "notification-preferences"],
      });
      toast.success("Notification preferences updated successfully");
    },
    onError: createMutationErrorHandler(
      "Failed to update notification preferences"
    ),
  });
}
