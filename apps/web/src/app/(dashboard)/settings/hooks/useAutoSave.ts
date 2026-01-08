/**
 * useAutoSave Hook
 *
 * Provides debounced auto-save functionality with status tracking.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SaveStatus } from "../components";

interface UseAutoSaveOptions<T> {
  /** Data to save */
  data: T;
  /** Save function */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in ms */
  delay?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  /** Current save status */
  status: SaveStatus;
  /** Error message if save failed */
  error: string | null;
  /** Manually trigger save */
  save: () => void;
  /** Reset status to idle */
  reset: () => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Track initial data to avoid saving on mount
  const initialDataRef = useRef<T>(data);
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stable reference to current data
  const dataRef = useRef<T>(data);
  dataRef.current = data;

  const performSave = useCallback(async () => {
    setStatus("saving");
    setError(null);

    try {
      await onSave(dataRef.current);
      setStatus("saved");

      // Clear saved status after 2 seconds
      savedTimeoutRef.current = setTimeout(() => {
        setStatus("idle");
      }, 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }, [onSave]);

  const save = useCallback(() => {
    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Clear any saved status timeout
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
      savedTimeoutRef.current = null;
    }

    performSave();
  }, [performSave]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) {
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  return {
    status,
    error,
    save,
    reset,
  };
}
