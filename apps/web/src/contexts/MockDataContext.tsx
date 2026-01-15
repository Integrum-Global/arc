/**
 * Mock Data Context
 *
 * Provides a toggle to switch between real API data and mock data for development.
 * When enabled, MSW intercepts API requests and returns mock responses.
 */

"use client";

import * as React from "react";

const MOCK_DATA_KEY = "arc-mock-data-enabled";

interface MockDataContextValue {
  /** Whether mock data mode is enabled */
  isMockEnabled: boolean;
  /** Toggle mock data mode */
  toggleMockData: () => void;
  /** Set mock data mode explicitly */
  setMockData: (enabled: boolean) => void;
  /** Whether MSW has been initialized */
  isInitialized: boolean;
}

const MockDataContext = React.createContext<MockDataContextValue | undefined>(
  undefined
);

interface MockDataProviderProps {
  children: React.ReactNode;
}

/**
 * MockDataProvider enables toggling between real API and mock data
 */
export function MockDataProvider({ children }: MockDataProviderProps) {
  const [isMockEnabled, setIsMockEnabled] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load initial state from localStorage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(MOCK_DATA_KEY);
      const enabled = stored === "true";
      setIsMockEnabled(enabled);

      // Initialize MSW if mock mode is enabled
      if (enabled) {
        initializeMSW().then(() => setIsInitialized(true));
      } else {
        setIsInitialized(true);
      }
    }
  }, []);

  // Handle mock mode changes
  const setMockData = React.useCallback(async (enabled: boolean) => {
    setIsMockEnabled(enabled);
    localStorage.setItem(MOCK_DATA_KEY, String(enabled));

    if (enabled) {
      await initializeMSW();
    } else {
      // Stop MSW if running
      stopMSW();
    }
  }, []);

  const toggleMockData = React.useCallback(() => {
    setMockData(!isMockEnabled);
  }, [isMockEnabled, setMockData]);

  const value = React.useMemo(
    () => ({
      isMockEnabled,
      toggleMockData,
      setMockData,
      isInitialized,
    }),
    [isMockEnabled, toggleMockData, setMockData, isInitialized]
  );

  return (
    <MockDataContext.Provider value={value}>
      {children}
    </MockDataContext.Provider>
  );
}

/**
 * Hook to access mock data context
 */
export function useMockData() {
  const context = React.useContext(MockDataContext);
  if (context === undefined) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
}

// MSW worker instance
let mswWorker: ReturnType<typeof import("msw/browser").setupWorker> | null = null;

/**
 * Initialize MSW in the browser
 */
async function initializeMSW() {
  if (typeof window === "undefined") return;

  // Only initialize once
  if (mswWorker) {
    await mswWorker.start({ onUnhandledRequest: "bypass" });
    return;
  }

  try {
    const { setupWorker } = await import("msw/browser");
    const { handlers } = await import("@/test/mocks/handlers");

    mswWorker = setupWorker(...handlers);
    await mswWorker.start({
      onUnhandledRequest: "bypass",
      quiet: false,
    });

    console.log("[MSW] Mock Service Worker started");
  } catch (error) {
    console.error("[MSW] Failed to initialize Mock Service Worker:", error);
  }
}

/**
 * Stop MSW
 */
function stopMSW() {
  if (mswWorker) {
    mswWorker.stop();
    console.log("[MSW] Mock Service Worker stopped");
  }
}
