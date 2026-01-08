/**
 * Tests for useBreakpoint hooks
 *
 * Tests cover:
 * - useBreakpoint - responsive breakpoint detection
 * - useIsMobile - mobile viewport detection
 * - useIsTablet - tablet viewport detection
 * - useIsDesktop - desktop viewport detection
 * - useMediaQuery - custom media query matching
 * - Breakpoint constants
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  useBreakpoint,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useMediaQuery,
  breakpoints,
} from "../useBreakpoint";

describe("useBreakpoint hooks", () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let matchMediaMock: ReturnType<typeof vi.fn>;
  let resizeCallback: (() => void) | null = null;

  beforeEach(() => {
    // Store original values
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    resizeCallback = null;

    // Setup matchMedia mock
    matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === "change") {
          resizeCallback = handler;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    });
  });

  afterEach(() => {
    // Restore original values
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
    vi.restoreAllMocks();
  });

  // Helper to set window dimensions
  const setWindowSize = (width: number, height: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: height,
    });
  };

  // ==========================================================================
  // Breakpoint Constants
  // ==========================================================================

  describe("breakpoints", () => {
    it("should export correct breakpoint values", () => {
      expect(breakpoints.sm).toBe(640);
      expect(breakpoints.md).toBe(768);
      expect(breakpoints.lg).toBe(1024);
      expect(breakpoints.xl).toBe(1280);
      expect(breakpoints["2xl"]).toBe(1536);
    });
  });

  // ==========================================================================
  // useBreakpoint
  // ==========================================================================

  describe("useBreakpoint", () => {
    it("should return mobile for width < 768", () => {
      setWindowSize(375, 667);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe("mobile");
    });

    it("should return tablet for width >= 768 and < 1024", () => {
      setWindowSize(800, 600);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe("tablet");
    });

    it("should return desktop for width >= 1024", () => {
      setWindowSize(1280, 800);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe("desktop");
    });

    it("should handle edge case at md breakpoint (768px)", () => {
      setWindowSize(768, 1024);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe("tablet");
    });

    it("should handle edge case at lg breakpoint (1024px)", () => {
      setWindowSize(1024, 768);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe("desktop");
    });

    it("should handle very small viewport", () => {
      setWindowSize(320, 480);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe("mobile");
    });

    it("should handle very large viewport", () => {
      setWindowSize(2560, 1440);

      const { result } = renderHook(() => useBreakpoint());

      expect(result.current).toBe("desktop");
    });
  });

  // ==========================================================================
  // useIsMobile
  // ==========================================================================

  describe("useIsMobile", () => {
    it("should return true for mobile viewport", () => {
      setWindowSize(375, 667);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it("should return false for tablet viewport", () => {
      setWindowSize(800, 600);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it("should return false for desktop viewport", () => {
      setWindowSize(1280, 800);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it("should return true at viewport width 767", () => {
      setWindowSize(767, 600);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it("should return false at viewport width 768", () => {
      setWindowSize(768, 600);

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  // ==========================================================================
  // useIsTablet
  // ==========================================================================

  describe("useIsTablet", () => {
    it("should return false for mobile viewport", () => {
      setWindowSize(375, 667);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(false);
    });

    it("should return true for tablet viewport", () => {
      setWindowSize(800, 600);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(true);
    });

    it("should return false for desktop viewport", () => {
      setWindowSize(1280, 800);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(false);
    });

    it("should handle exact md breakpoint", () => {
      setWindowSize(768, 1024);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(true);
    });

    it("should handle width just below lg breakpoint", () => {
      setWindowSize(1023, 768);

      const { result } = renderHook(() => useIsTablet());

      expect(result.current).toBe(true);
    });
  });

  // ==========================================================================
  // useIsDesktop
  // ==========================================================================

  describe("useIsDesktop", () => {
    it("should return false for mobile viewport", () => {
      setWindowSize(375, 667);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);
    });

    it("should return false for tablet viewport", () => {
      setWindowSize(800, 600);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);
    });

    it("should return true for desktop viewport", () => {
      setWindowSize(1280, 800);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(true);
    });

    it("should handle exact lg breakpoint", () => {
      setWindowSize(1024, 768);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(true);
    });

    it("should return false just below lg breakpoint", () => {
      setWindowSize(1023, 768);

      const { result } = renderHook(() => useIsDesktop());

      expect(result.current).toBe(false);
    });
  });

  // ==========================================================================
  // useMediaQuery
  // ==========================================================================

  describe("useMediaQuery", () => {
    it("should return true when media query matches", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(min-width: 1024px)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

      expect(result.current).toBe(true);
    });

    it("should return false when media query does not match", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useMediaQuery("(min-width: 1024px)"));

      expect(result.current).toBe(false);
    });

    it("should handle prefers-reduced-motion query", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() =>
        useMediaQuery("(prefers-reduced-motion: reduce)")
      );

      expect(result.current).toBe(true);
    });

    it("should handle prefers-color-scheme query", () => {
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() =>
        useMediaQuery("(prefers-color-scheme: dark)")
      );

      expect(result.current).toBe(true);
    });

    it("should call matchMedia with the correct query", () => {
      renderHook(() => useMediaQuery("(min-width: 768px)"));

      expect(matchMediaMock).toHaveBeenCalledWith("(min-width: 768px)");
    });
  });

  // ==========================================================================
  // Breakpoint Boundary Tests
  // ==========================================================================

  describe("breakpoint boundaries", () => {
    it("should correctly categorize width 767 as mobile", () => {
      setWindowSize(767, 600);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("mobile");
    });

    it("should correctly categorize width 768 as tablet", () => {
      setWindowSize(768, 600);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("tablet");
    });

    it("should correctly categorize width 1023 as tablet", () => {
      setWindowSize(1023, 600);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("tablet");
    });

    it("should correctly categorize width 1024 as desktop", () => {
      setWindowSize(1024, 600);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("desktop");
    });
  });

  // ==========================================================================
  // Various Device Sizes
  // ==========================================================================

  describe("common device sizes", () => {
    it("should handle iPhone SE (375x667)", () => {
      setWindowSize(375, 667);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("mobile");
    });

    it("should handle iPhone 14 (390x844)", () => {
      setWindowSize(390, 844);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("mobile");
    });

    it("should handle iPad Mini (768x1024)", () => {
      setWindowSize(768, 1024);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("tablet");
    });

    it("should handle iPad Pro 11 (834x1194)", () => {
      setWindowSize(834, 1194);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("tablet");
    });

    it("should handle MacBook Air 13 (1280x800)", () => {
      setWindowSize(1280, 800);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("desktop");
    });

    it("should handle 1080p Display (1920x1080)", () => {
      setWindowSize(1920, 1080);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("desktop");
    });

    it("should handle 4K Display (3840x2160)", () => {
      setWindowSize(3840, 2160);
      const { result } = renderHook(() => useBreakpoint());
      expect(result.current).toBe("desktop");
    });
  });

  // ==========================================================================
  // Hook Consistency
  // ==========================================================================

  describe("hook consistency", () => {
    it("should have consistent results across related hooks for mobile", () => {
      setWindowSize(375, 667);

      const { result: breakpointResult } = renderHook(() => useBreakpoint());
      const { result: isMobileResult } = renderHook(() => useIsMobile());
      const { result: isTabletResult } = renderHook(() => useIsTablet());
      const { result: isDesktopResult } = renderHook(() => useIsDesktop());

      expect(breakpointResult.current).toBe("mobile");
      expect(isMobileResult.current).toBe(true);
      expect(isTabletResult.current).toBe(false);
      expect(isDesktopResult.current).toBe(false);
    });

    it("should have consistent results across related hooks for tablet", () => {
      setWindowSize(800, 600);

      const { result: breakpointResult } = renderHook(() => useBreakpoint());
      const { result: isMobileResult } = renderHook(() => useIsMobile());
      const { result: isTabletResult } = renderHook(() => useIsTablet());
      const { result: isDesktopResult } = renderHook(() => useIsDesktop());

      expect(breakpointResult.current).toBe("tablet");
      expect(isMobileResult.current).toBe(false);
      expect(isTabletResult.current).toBe(true);
      expect(isDesktopResult.current).toBe(false);
    });

    it("should have consistent results across related hooks for desktop", () => {
      setWindowSize(1280, 800);

      const { result: breakpointResult } = renderHook(() => useBreakpoint());
      const { result: isMobileResult } = renderHook(() => useIsMobile());
      const { result: isTabletResult } = renderHook(() => useIsTablet());
      const { result: isDesktopResult } = renderHook(() => useIsDesktop());

      expect(breakpointResult.current).toBe("desktop");
      expect(isMobileResult.current).toBe(false);
      expect(isTabletResult.current).toBe(false);
      expect(isDesktopResult.current).toBe(true);
    });
  });
});
