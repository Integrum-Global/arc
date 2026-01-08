/**
 * Tests for useAutoSave hook
 *
 * Tests cover:
 * - Debounced auto-save functionality
 * - Save status tracking
 * - Error handling
 * - Manual save trigger
 * - Reset functionality
 * - First render skip
 * - Cleanup on unmount
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAutoSave } from "../../app/(dashboard)/settings/hooks/useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  // ==========================================================================
  // Initial State
  // ==========================================================================

  describe("initial state", () => {
    it("should return idle status initially", () => {
      const onSave = vi.fn();

      const { result } = renderHook(() =>
        useAutoSave({
          data: { name: "test" },
          onSave,
        })
      );

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
    });

    it("should not call onSave on initial render", () => {
      const onSave = vi.fn();

      renderHook(() =>
        useAutoSave({
          data: { name: "test" },
          onSave,
        })
      );

      // Advance timers past debounce delay
      vi.advanceTimersByTime(2000);

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Debounced Save
  // ==========================================================================

  describe("debounced save", () => {
    it("should trigger save after data change and debounce delay", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 1000,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data to trigger save
      rerender({ data: { name: "updated" } });

      // Should not have saved yet
      expect(onSave).not.toHaveBeenCalled();

      // Advance past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onSave).toHaveBeenCalledWith({ name: "updated" });
    });

    it("should reset debounce timer on subsequent changes", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 1000,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // First change
      rerender({ data: { name: "change1" } });

      // Advance 500ms (half the delay)
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Second change should reset the timer
      rerender({ data: { name: "change2" } });

      // Advance another 500ms
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Should not have saved yet (timer was reset)
      expect(onSave).not.toHaveBeenCalled();

      // Advance full delay
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Now it should have saved with the latest data
      expect(onSave).toHaveBeenCalledWith({ name: "change2" });
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("should use custom delay", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 2000, // Custom 2 second delay
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data
      rerender({ data: { name: "updated" } });

      // Advance 1 second (should not have saved)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onSave).not.toHaveBeenCalled();

      // Advance another second (total 2 seconds)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(onSave).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Status Tracking
  // ==========================================================================

  describe("status tracking", () => {
    it("should show saving status during save", async () => {
      let resolvePromise: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      const onSave = vi.fn().mockReturnValue(savePromise);

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data
      rerender({ data: { name: "updated" } });

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Should be in saving state
      expect(result.current.status).toBe("saving");

      // Resolve the save
      await act(async () => {
        resolvePromise!();
      });

      expect(result.current.status).toBe("saved");
    });

    it("should return to idle after saved status displays", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data and trigger save
      rerender({ data: { name: "updated" } });

      // Advance timers and flush promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Should be in saved state after promise resolves
      expect(result.current.status).toBe("saved");

      // Advance past the "saved" display time (2 seconds)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.status).toBe("idle");
    });

    it("should show error status on save failure", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data and trigger save
      rerender({ data: { name: "updated" } });

      // Advance timers and flush promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Should be in error state after promise rejects
      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe("Save failed");
    });

    it("should handle non-Error objects in catch", async () => {
      const onSave = vi.fn().mockRejectedValue("String error");

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data and trigger save
      rerender({ data: { name: "updated" } });

      // Advance timers and flush promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Should be in error state after promise rejects
      expect(result.current.status).toBe("error");
      expect(result.current.error).toBe("Failed to save");
    });
  });

  // ==========================================================================
  // Manual Save
  // ==========================================================================

  describe("manual save", () => {
    it("should trigger immediate save when save() is called", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 5000, // Long delay to ensure manual save is immediate
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Update data
      rerender({ data: { name: "updated" } });

      // Manually trigger save without waiting for debounce
      await act(async () => {
        result.current.save();
      });

      expect(onSave).toHaveBeenCalledWith({ name: "updated" });
    });

    it("should cancel pending debounced save when manual save is called", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 1000,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data (starts debounce timer)
      rerender({ data: { name: "debounced" } });

      // Advance 500ms
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Update again and manually save
      rerender({ data: { name: "manual" } });

      await act(async () => {
        result.current.save();
      });

      // Should have been called with manual data
      expect(onSave).toHaveBeenCalledWith({ name: "manual" });

      // Advance past original debounce
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should not have been called again
      expect(onSave).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // Reset Functionality
  // ==========================================================================

  describe("reset functionality", () => {
    it("should reset status to idle when reset() is called", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Trigger error
      rerender({ data: { name: "updated" } });

      // Advance timers and flush promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.status).toBe("error");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
    });

    it("should clear error when reset() is called", async () => {
      const onSave = vi.fn().mockRejectedValue(new Error("Save failed"));

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Trigger error
      rerender({ data: { name: "updated" } });

      // Advance timers and flush promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.error).toBe("Save failed");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  // ==========================================================================
  // Enabled/Disabled
  // ==========================================================================

  describe("enabled/disabled", () => {
    it("should not auto-save when enabled is false", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data, enabled }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
            enabled,
          }),
        {
          initialProps: { data: { name: "initial" }, enabled: false },
        }
      );

      // Change data
      rerender({ data: { name: "updated" }, enabled: false });

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(200);
      });

      expect(onSave).not.toHaveBeenCalled();
    });

    it("should start auto-saving when enabled changes to true", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data, enabled }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
            enabled,
          }),
        {
          initialProps: { data: { name: "initial" }, enabled: false },
        }
      );

      // Enable auto-save with new data
      rerender({ data: { name: "updated" }, enabled: true });

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onSave).toHaveBeenCalledWith({ name: "updated" });
    });

    it("should default to enabled when not specified", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data
      rerender({ data: { name: "updated" } });

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onSave).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  describe("cleanup", () => {
    it("should cancel pending timeout on unmount", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { rerender, unmount } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 1000,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Change data to start timer
      rerender({ data: { name: "updated" } });

      // Unmount before debounce completes
      unmount();

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      // Should not have been called
      expect(onSave).not.toHaveBeenCalled();
    });

    it("should cancel saved timeout on unmount", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender, unmount } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // Trigger save
      rerender({ data: { name: "updated" } });

      // Advance timers and flush promises
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      expect(result.current.status).toBe("saved");

      // Unmount before saved status clears
      unmount();

      // Advance past saved timeout
      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });

      // No errors should occur
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe("edge cases", () => {
    it("should handle rapid data changes gracefully", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 500,
          }),
        {
          initialProps: { data: { count: 0 } },
        }
      );

      // Rapidly change data
      for (let i = 1; i <= 10; i++) {
        rerender({ data: { count: i } });
      }

      // Advance past debounce
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Should only save once with final value
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ count: 10 });
    });

    it("should handle concurrent save attempts", async () => {
      let saveCount = 0;
      const onSave = vi.fn().mockImplementation(async () => {
        saveCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 100,
          }),
        {
          initialProps: { data: { name: "initial" } },
        }
      );

      // First change
      rerender({ data: { name: "first" } });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      // Manual save while debounced save is pending
      await act(async () => {
        result.current.save();
      });

      // The manual save should take precedence
      expect(onSave).toHaveBeenCalled();
    });

    it("should use latest data reference for save", async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) =>
          useAutoSave({
            data,
            onSave,
            delay: 1000,
          }),
        {
          initialProps: { data: { value: "old" } },
        }
      );

      // Update data
      rerender({ data: { value: "new" } });

      // Wait briefly but not enough for auto-save
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Update data again
      rerender({ data: { value: "newest" } });

      // Manual save should use the newest data
      await act(async () => {
        result.current.save();
      });

      expect(onSave).toHaveBeenCalledWith({ value: "newest" });
    });
  });
});
