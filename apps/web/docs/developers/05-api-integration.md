# API Integration

## Overview

The API client is built on Axios with automatic authentication, error handling, and type safety.

## Configuration

### Client Setup

```typescript
// src/lib/api/client.ts
import axios from "axios";
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints

```typescript
// src/lib/api/endpoints.ts
import { apiClient } from "./client";
import type {
  Portfolio,
  Holding,
  Transaction,
  Alert,
  ApiResponse,
} from "@/types/api";

export const api = {
  // Portfolios
  portfolios: {
    list: async (filters?: object): Promise<ApiResponse<Portfolio[]>> => {
      const { data } = await apiClient.get("/portfolios", { params: filters });
      return data;
    },
    get: async (id: string): Promise<ApiResponse<Portfolio>> => {
      const { data } = await apiClient.get(`/portfolios/${id}`);
      return data;
    },
    create: async (payload: CreatePortfolioInput): Promise<ApiResponse<Portfolio>> => {
      const { data } = await apiClient.post("/portfolios", payload);
      return data;
    },
    update: async (id: string, payload: UpdatePortfolioInput): Promise<ApiResponse<Portfolio>> => {
      const { data } = await apiClient.put(`/portfolios/${id}`, payload);
      return data;
    },
    delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/portfolios/${id}`);
    },
  },

  // Holdings
  holdings: {
    list: async (portfolioId: string): Promise<ApiResponse<Holding[]>> => {
      const { data } = await apiClient.get(`/portfolios/${portfolioId}/holdings`);
      return data;
    },
    // ... more endpoints
  },

  // Analytics
  analytics: {
    ratios: async (portfolioId: string): Promise<ApiResponse<RatioData>> => {
      const { data } = await apiClient.get(`/analytics/ratios/${portfolioId}`);
      return data;
    },
    // ... more endpoints
  },

  // Alerts
  alerts: {
    list: async (filters?: AlertFilters): Promise<ApiResponse<Alert[]>> => {
      const { data } = await apiClient.get("/alerts", { params: filters });
      return data;
    },
    acknowledge: async (id: string): Promise<void> => {
      await apiClient.post(`/alerts/${id}/acknowledge`);
    },
    dismiss: async (id: string): Promise<void> => {
      await apiClient.post(`/alerts/${id}/dismiss`);
    },
  },

  // Intelligence
  intelligence: {
    query: async (question: string): Promise<ApiResponse<QueryResponse>> => {
      const { data } = await apiClient.post("/intelligence/query", { question });
      return data;
    },
    brief: async (type: "daily" | "weekly"): Promise<ApiResponse<Brief>> => {
      const { data } = await apiClient.get(`/intelligence/brief/${type}`);
      return data;
    },
  },
};
```

## Error Handling

### Error Types

```typescript
// src/lib/api/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 500;
    const message = error.response?.data?.message ?? "An error occurred";
    const code = error.response?.data?.code;
    return new ApiError(message, status, code);
  }
  return new ApiError("An unexpected error occurred", 500);
}
```

### Error Display

```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export function ErrorDisplay({ error }: { error: Error }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}
```

## Type Definitions

```typescript
// src/types/api.ts

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Portfolio types
export interface Portfolio {
  id: string;
  name: string;
  code: string;
  type: "managed" | "model" | "benchmark";
  currency: string;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  ytdReturn: number;
  holdingsCount: number;
  healthScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  id: string;
  portfolioId: string;
  securityId: string;
  ticker: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  weight: number;
  sector: string;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  type: "buy" | "sell" | "dividend" | "fee";
  securityId: string;
  ticker: string;
  quantity: number;
  price: number;
  amount: number;
  fees: number;
  date: string;
  status: "pending" | "completed" | "failed";
}

export interface Alert {
  id: string;
  type: "threshold" | "anomaly" | "news";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  securityId?: string;
  ticker?: string;
  ratioName?: string;
  currentValue?: number;
  thresholdValue?: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  dismissedAt?: string;
}
```

## Streaming Responses

For AI-powered features that stream responses:

```typescript
// src/lib/api/streaming.ts
export async function* streamQuery(question: string): AsyncGenerator<string> {
  const response = await fetch(`${API_URL}/intelligence/query/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${useAuthStore.getState().token}`,
    },
    body: JSON.stringify({ question }),
  });

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    yield chunk;
  }
}

// Usage in component
export function useStreamingQuery() {
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const query = async (question: string) => {
    setIsStreaming(true);
    setResponse("");

    for await (const chunk of streamQuery(question)) {
      setResponse((prev) => prev + chunk);
    }

    setIsStreaming(false);
  };

  return { response, isStreaming, query };
}
```

## Best Practices

1. **Always type API responses**
2. **Use query keys consistently** for cache management
3. **Handle loading and error states** in every component
4. **Implement retry logic** for transient failures
5. **Use optimistic updates** for better UX
6. **Log errors** for debugging
