const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';
const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/${API_VERSION}`;

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>;
}

export interface ApiErrorResponse {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
  path: string;
  requestId: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public requestId?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setAuthToken(_token: string | null) { }

export function getAuthToken(): string | null {
  return null;
}

export function clearAuthToken() { }

function getMessageFromErrorBody(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const b = body as Record<string, unknown>;
  if (typeof b.message === 'string') return b.message;
  if (Array.isArray(b.message)) return b.message.join(', ');
  if (typeof b.error === 'string') return b.error;
  return fallback;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 3000];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchApi<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      let url = `${API_BASE}${endpoint}`;
      
      if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, String(value));
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string> | undefined),
      };

      const authToken = getAuthToken();
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        ...fetchOptions,
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = null;
        }
        
        const message = getMessageFromErrorBody(errorBody, 'Request failed');
        const apiError = new ApiError(
          response.status,
          message,
          (errorBody as ApiErrorResponse)?.code,
          (errorBody as ApiErrorResponse)?.requestId
        );
        throw apiError;
      }

      return response.json();
    } catch (err) {
      lastError = err as Error;
      
      const isRetryable = 
        err instanceof TypeError || 
        (err instanceof ApiError && (err.status === 0 || err.status >= 500));
      
      if (isRetryable && attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_DELAYS[attempt]);
        continue;
      }
      
      throw lastError;
    }
  }

  throw lastError;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined>) =>
    fetchApi<T>(endpoint, { method: 'GET', params }),
    
  post: <T>(endpoint: string, body?: unknown) =>
    fetchApi<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    
  put: <T>(endpoint: string, body?: unknown) =>
    fetchApi<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    
  delete: <T>(endpoint: string) =>
    fetchApi<T>(endpoint, { method: 'DELETE' }),
};

export { ApiError };
export default api;