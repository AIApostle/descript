import type { AuthResponseDTO } from '../types/auth';

const DEFAULT_PRODUCTION_API_URL = 'https://descript-ffch.onrender.com/api/v1';

const resolveApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  // When running in production on Vercel or any non-localhost host without a local proxy,
  // target the live Render production backend directly.
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return DEFAULT_PRODUCTION_API_URL;
  }
  return '/api/v1';
};

const API_BASE_URL = resolveApiBaseUrl();
export const SESSION_STORAGE_KEY = 'descript_session';

export class APIError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(status: number, message: string, code = 'API_ERROR', details?: Record<string, unknown>) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface StoredTokens {
  token: string | null;
  refreshToken: string | null;
  expiresAt?: number;
}

class APIClient {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getStoredTokens(): StoredTokens {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return { token: null, refreshToken: null };
      const parsed = JSON.parse(raw) as Partial<StoredTokens>;
      return {
        token: parsed.token ?? null,
        refreshToken: parsed.refreshToken ?? null,
        expiresAt: parsed.expiresAt,
      };
    } catch {
      return { token: null, refreshToken: null };
    }
  }

  private async tryRefreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const { refreshToken } = this.getStoredTokens();
    if (!refreshToken) return null;

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!response.ok) return null;
        const data = (await response.json()) as AuthResponseDTO;
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          })
        );
        return data.token;
      } catch {
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    body?: unknown,
    options?: { skipAuth?: boolean; retryOn401?: boolean }
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (!options?.skipAuth) {
      const { token } = this.getStoredTokens();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new APIError(0, 'Unable to reach Descript API server. Check your connection.', 'NETWORK_ERROR');
    }

    if (
      response.status === 401 &&
      !options?.skipAuth &&
      options?.retryOn401 !== false &&
      !endpoint.startsWith('/auth/')
    ) {
      const nextToken = await this.tryRefreshToken();
      if (nextToken) {
        return this.request<T>(method, endpoint, body, { ...options, retryOn401: false });
      }
    }

    if (!response.ok) {
      let code = 'API_ERROR';
      let message = response.statusText || `Request failed (${response.status})`;
      let details: Record<string, unknown> | undefined;

      try {
        const errBody = (await response.json()) as { detail?: unknown; error?: string; message?: string };
        const detail = errBody.detail ?? errBody;
        if (typeof detail === 'object' && detail !== null && !Array.isArray(detail)) {
          const obj = detail as Record<string, unknown>;
          if (typeof obj.error === 'string') code = obj.error;
          if (typeof obj.message === 'string') message = obj.message;
          if (typeof obj.details === 'object' && obj.details !== null) {
            details = obj.details as Record<string, unknown>;
          }
        } else if (Array.isArray(detail) && detail.length > 0) {
          message = detail
            .map((d) => (typeof d === 'object' && d && 'msg' in d ? String((d as { msg: unknown }).msg) : String(d)))
            .join('; ');
          code = 'VALIDATION_ERROR';
        } else if (typeof detail === 'string') {
          message = detail;
        }
      } catch {
        // Fallback to statusText
      }

      throw new APIError(response.status, message, code, details);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return (await response.json()) as T;
  }

  get<T>(endpoint: string, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  post<T>(endpoint: string, body?: unknown, options?: { skipAuth?: boolean }): Promise<T> {
    return this.request<T>('POST', endpoint, body, options);
  }

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', endpoint, body);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const api = new APIClient();
