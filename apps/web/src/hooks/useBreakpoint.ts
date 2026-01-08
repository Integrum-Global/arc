/**
 * Responsive Breakpoint Utilities
 *
 * Custom hooks for responsive design based on Tailwind CSS breakpoints.
 * Uses window.matchMedia for efficient media query matching.
 */

"use client";

import { useSyncExternalStore, useCallback } from "react";

/**
 * Tailwind CSS default breakpoints
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type BreakpointKey = keyof typeof breakpoints;
export type Breakpoint = "mobile" | "tablet" | "desktop";

/**
 * Get the current breakpoint based on window width
 * @param width Current window width
 * @returns Current breakpoint name
 */
function getBreakpoint(width: number): Breakpoint {
  if (width < breakpoints.md) {
    return "mobile";
  }
  if (width < breakpoints.lg) {
    return "tablet";
  }
  return "desktop";
}

/**
 * Subscribe to window resize events
 */
function subscribeToResize(callback: () => void): () => void {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

/**
 * Get current breakpoint snapshot
 */
function getBreakpointSnapshot(): Breakpoint {
  return getBreakpoint(window.innerWidth);
}

/**
 * Server snapshot for SSR
 */
function getBreakpointServerSnapshot(): Breakpoint {
  return "desktop";
}

/**
 * Hook to get the current responsive breakpoint
 *
 * @returns Current breakpoint: 'mobile' | 'tablet' | 'desktop'
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const breakpoint = useBreakpoint();
 *
 *   if (breakpoint === 'mobile') {
 *     return <MobileLayout />;
 *   }
 *   return <DesktopLayout />;
 * }
 * ```
 */
export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(
    subscribeToResize,
    getBreakpointSnapshot,
    getBreakpointServerSnapshot
  );
}

/**
 * Hook to check if the current viewport is mobile
 *
 * @returns Boolean indicating if viewport is mobile (<768px)
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return (
 *     <div className={isMobile ? 'p-4' : 'p-8'}>
 *       {isMobile ? <MobileView /> : <DesktopView />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useIsMobile(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "mobile";
}

/**
 * Hook to check if the current viewport is tablet
 *
 * @returns Boolean indicating if viewport is tablet (768px - 1023px)
 */
export function useIsTablet(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "tablet";
}

/**
 * Hook to check if the current viewport is desktop
 *
 * @returns Boolean indicating if viewport is desktop (>=1024px)
 */
export function useIsDesktop(): boolean {
  const breakpoint = useBreakpoint();
  return breakpoint === "desktop";
}

/**
 * Create a media query subscriber
 */
function createMediaQuerySubscribe(query: string) {
  return (callback: () => void): (() => void) => {
    if (typeof window === "undefined") {
      return () => {};
    }
    const mediaQuery = window.matchMedia(query);
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  };
}

/**
 * Hook to match a specific media query
 *
 * @param query Media query string (e.g., "(min-width: 768px)")
 * @returns Boolean indicating if the query matches
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isLargeScreen = useMediaQuery('(min-width: 1024px)');
 *   const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
 *
 *   return (
 *     <motion.div animate={prefersReducedMotion ? {} : { opacity: 1 }}>
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => createMediaQuerySubscribe(query)(callback),
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Get current window size snapshot
 */
function getWindowSizeSnapshot(): { width: number; height: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Server snapshot for window size
 */
function getWindowSizeServerSnapshot(): { width: number; height: number } {
  return { width: 1024, height: 768 };
}

/**
 * Hook to get the current window dimensions
 *
 * @returns Object with width and height
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { width, height } = useWindowSize();
 *
 *   return (
 *     <div>
 *       Window: {width}x{height}
 *     </div>
 *   );
 * }
 * ```
 */
export function useWindowSize(): { width: number; height: number } {
  return useSyncExternalStore(
    subscribeToResize,
    getWindowSizeSnapshot,
    getWindowSizeServerSnapshot
  );
}
