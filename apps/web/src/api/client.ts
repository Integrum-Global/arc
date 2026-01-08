import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  _retryDelay?: number;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(retryCount: number): number {
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  const jitter = Math.random() * 1000;
  return Math.min(baseDelay + jitter, 30000); // Max 30 seconds
}

/**
 * Sleep for a given duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  // Network errors are retryable
  if (!error.response) {
    return true;
  }

  // Check for retryable status codes
  return RETRY_STATUS_CODES.includes(error.response.status);
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token and request ID
apiClient.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("arcToken") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["X-Request-ID"] = crypto.randomUUID();
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors with retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig | undefined;

    if (!config) {
      return Promise.reject(error);
    }

    // Initialize retry count
    config._retryCount = config._retryCount ?? 0;

    // Handle 401 - token expired or invalid
    if (error.response?.status === 401) {
      // Try to refresh token first
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Retry the original request with new token
        const token = localStorage.getItem("arcToken");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(config);
      }

      // Refresh failed, redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("arcToken");
        localStorage.removeItem("arcRefreshToken");
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    // Check if we should retry
    if (isRetryableError(error) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      const delay = getRetryDelay(config._retryCount);

      console.warn(
        `Retrying request (attempt ${config._retryCount}/${MAX_RETRIES}) after ${delay}ms`
      );

      await sleep(delay);
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

/**
 * Attempt to refresh the authentication token
 */
async function attemptTokenRefresh(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const refreshToken = localStorage.getItem("arcRefreshToken");
  if (!refreshToken) {
    return false;
  }

  try {
    // Use a separate axios instance to avoid interceptor loops
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: newRefreshToken } = response.data;

    localStorage.setItem("arcToken", access_token);
    if (newRefreshToken) {
      localStorage.setItem("arcRefreshToken", newRefreshToken);
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Generic GET request with type safety
 */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

/**
 * Generic POST request with type safety
 */
export async function post<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * Generic PUT request with type safety
 */
export async function put<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * Generic PATCH request with type safety
 */
export async function patch<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<T>(url, data, config);
  return response.data;
}

/**
 * Generic DELETE request with type safety
 */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

export { AxiosError };
