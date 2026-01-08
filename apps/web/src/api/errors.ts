/**
 * API Error Handling Utilities
 * Provides structured error handling for API responses
 */

import { AxiosError } from "axios";
import { toast } from "sonner";

/**
 * Error codes for API errors
 */
export enum ApiErrorCode {
  // Authentication errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Validation errors
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  ALREADY_EXISTS = "ALREADY_EXISTS",

  // Server errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  TIMEOUT = "TIMEOUT",

  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  REQUEST_CANCELLED = "REQUEST_CANCELLED",

  // Unknown
  UNKNOWN = "UNKNOWN",
}

/**
 * Structured API Error class
 */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: ApiErrorCode = ApiErrorCode.UNKNOWN,
    options?: {
      statusCode?: number;
      details?: Record<string, unknown>;
      requestId?: string;
      cause?: Error;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = "ApiError";
    this.code = code;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    this.requestId = options?.requestId;
  }

  /**
   * Check if this is a specific error code
   */
  is(code: ApiErrorCode): boolean {
    return this.code === code;
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return [
      ApiErrorCode.UNAUTHORIZED,
      ApiErrorCode.FORBIDDEN,
      ApiErrorCode.TOKEN_EXPIRED,
      ApiErrorCode.INVALID_CREDENTIALS,
    ].includes(this.code);
  }

  /**
   * Check if this is a validation error
   */
  isValidationError(): boolean {
    return [ApiErrorCode.VALIDATION_ERROR, ApiErrorCode.INVALID_INPUT].includes(
      this.code
    );
  }

  /**
   * Check if this is a network error
   */
  isNetworkError(): boolean {
    return [ApiErrorCode.NETWORK_ERROR, ApiErrorCode.TIMEOUT].includes(
      this.code
    );
  }

  /**
   * Convert to a plain object for logging
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      requestId: this.requestId,
    };
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError || (error as AxiosError)?.isAxiosError;
}

/**
 * Map HTTP status code to ApiErrorCode
 */
function mapStatusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return ApiErrorCode.VALIDATION_ERROR;
    case 401:
      return ApiErrorCode.UNAUTHORIZED;
    case 403:
      return ApiErrorCode.FORBIDDEN;
    case 404:
      return ApiErrorCode.NOT_FOUND;
    case 408:
      return ApiErrorCode.TIMEOUT;
    case 409:
      return ApiErrorCode.CONFLICT;
    case 422:
      return ApiErrorCode.INVALID_INPUT;
    case 500:
      return ApiErrorCode.INTERNAL_ERROR;
    case 503:
      return ApiErrorCode.SERVICE_UNAVAILABLE;
    default:
      return status >= 500
        ? ApiErrorCode.INTERNAL_ERROR
        : ApiErrorCode.UNKNOWN;
  }
}

/**
 * Parse an error into a structured ApiError
 */
export function parseApiError(error: unknown): ApiError {
  // Already an ApiError
  if (isApiError(error)) {
    return error;
  }

  // Axios error with response
  if (isAxiosError(error)) {
    if (error.response) {
      const data = error.response.data as Record<string, unknown> | undefined;
      const message =
        (data?.message as string) ||
        (data?.error as string) ||
        error.message ||
        "An unexpected error occurred";

      return new ApiError(message, mapStatusToErrorCode(error.response.status), {
        statusCode: error.response.status,
        details: data?.details as Record<string, unknown> | undefined,
        requestId: data?.request_id as string | undefined,
        cause: error,
      });
    }

    // Network error (no response)
    if (error.code === "ECONNABORTED") {
      return new ApiError("Request timed out", ApiErrorCode.TIMEOUT, {
        cause: error,
      });
    }

    if (error.code === "ERR_CANCELED") {
      return new ApiError("Request was cancelled", ApiErrorCode.REQUEST_CANCELLED, {
        cause: error,
      });
    }

    return new ApiError(
      error.message || "Network error occurred",
      ApiErrorCode.NETWORK_ERROR,
      { cause: error }
    );
  }

  // Standard Error
  if (error instanceof Error) {
    return new ApiError(error.message, ApiErrorCode.UNKNOWN, { cause: error });
  }

  // Unknown error type
  return new ApiError(
    typeof error === "string" ? error : "An unexpected error occurred",
    ApiErrorCode.UNKNOWN
  );
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const apiError = parseApiError(error);

  switch (apiError.code) {
    case ApiErrorCode.UNAUTHORIZED:
      return "Please log in to continue";
    case ApiErrorCode.FORBIDDEN:
      return "You don't have permission to perform this action";
    case ApiErrorCode.NOT_FOUND:
      return "The requested resource was not found";
    case ApiErrorCode.VALIDATION_ERROR:
    case ApiErrorCode.INVALID_INPUT:
      return apiError.message || "Please check your input and try again";
    case ApiErrorCode.CONFLICT:
    case ApiErrorCode.ALREADY_EXISTS:
      return apiError.message || "This resource already exists";
    case ApiErrorCode.NETWORK_ERROR:
      return "Unable to connect to the server. Please check your internet connection.";
    case ApiErrorCode.TIMEOUT:
      return "The request timed out. Please try again.";
    case ApiErrorCode.SERVICE_UNAVAILABLE:
      return "The service is temporarily unavailable. Please try again later.";
    case ApiErrorCode.INTERNAL_ERROR:
      return "An unexpected error occurred. Please try again later.";
    default:
      return apiError.message || "An unexpected error occurred";
  }
}

/**
 * Handle API error with toast notification
 */
export function handleApiError(
  error: unknown,
  options?: {
    title?: string;
    showToast?: boolean;
    onError?: (error: ApiError) => void;
  }
): ApiError {
  const apiError = parseApiError(error);
  const { title = "Error", showToast = true, onError } = options || {};

  if (showToast) {
    // Don't show toast for auth errors (handled by interceptor redirect)
    if (!apiError.is(ApiErrorCode.UNAUTHORIZED)) {
      toast.error(title, {
        description: getErrorMessage(apiError),
      });
    }
  }

  // Log error for debugging
  console.error("[API Error]", apiError.toJSON());

  // Call custom error handler if provided
  onError?.(apiError);

  return apiError;
}

/**
 * Create a mutation error handler for React Query
 */
export function createMutationErrorHandler(options?: {
  title?: string;
  onError?: (error: ApiError) => void;
}) {
  return (error: Error) => {
    handleApiError(error, {
      title: options?.title,
      showToast: true,
      onError: options?.onError,
    });
  };
}

/**
 * Retry condition for React Query
 * Returns true if the error should trigger a retry
 */
export function shouldRetryQuery(
  failureCount: number,
  error: Error
): boolean {
  const apiError = parseApiError(error);

  // Don't retry auth errors
  if (apiError.isAuthError()) {
    return false;
  }

  // Don't retry validation errors
  if (apiError.isValidationError()) {
    return false;
  }

  // Don't retry not found
  if (apiError.is(ApiErrorCode.NOT_FOUND)) {
    return false;
  }

  // Retry network errors up to 3 times
  if (apiError.isNetworkError()) {
    return failureCount < 3;
  }

  // Retry server errors up to 2 times
  if (apiError.statusCode && apiError.statusCode >= 500) {
    return failureCount < 2;
  }

  return false;
}
