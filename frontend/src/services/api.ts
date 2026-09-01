import type {
  Application,
  AuthResponse,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "../types/application";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "token";
const REFRESH_TOKEN_KEY = "refresh_token";

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function friendlyMessageForStatus(status: number, fallback?: string, isAuthEndpoint?: boolean): string {
  switch (status) {
    case 401:
      if (isAuthEndpoint) {
        return fallback || "Invalid email or password.";
      }
      return "Your session has expired. Please log in again.";
    case 404:
      return "We couldn't find what you were looking for.";
    case 422:
      return fallback || "Some of the information provided isn't valid.";
    case 429:
      return "Too many attempts. Please wait a moment and try again.";  
    case 500:
      return "Something went wrong on our end. Please try again shortly.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

// ---------------------------------------------------------------------------
// Refresh coordination — ensures only one refresh call happens at a time,
// no matter how many requests hit a 401 simultaneously.
// ---------------------------------------------------------------------------

let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/api/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });

    if (!response.ok) {
      clearToken();
      return false;
    }

    const data = (await response.json()) as AuthResponse;
    setTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    clearToken();
    return false;
  }
}

function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  skipRefresh?: boolean;
}

async function rawRequest(path: string, options: RequestOptions): Promise<{ response: Response; payload: unknown }> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  let payload: unknown = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null;
      }
    }
  }

  return { response, payload };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, skipRefresh = false } = options;

  const { response, payload } = await rawRequest(path, options);

  if (response.status === 204) {
    return undefined as T;
  }

  if (response.ok) {
    return payload as T;
  }

  // Only attempt a silent refresh for protected requests that failed with 401
  // (never for login/register itself, and never recursively during a refresh).
  if (response.status === 401 && auth && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retry = await rawRequest(path, options);
      if (retry.response.ok) {
        return retry.payload as T;
      }
      // Fall through to error handling using the retry's response below.
      return handleErrorResponse(retry.response, retry.payload, auth);
    }
  }

  return handleErrorResponse(response, payload, auth);
}

function handleErrorResponse(response: Response, payload: unknown, auth: boolean): never {
  const detailMessage =
    payload && typeof payload === "object" && payload !== null && "detail" in payload
      ? String((payload as { detail: unknown }).detail)
      : undefined;

  if (response.status === 401 && auth) {
    clearToken();
  }

  throw new ApiError(
    response.status,
    friendlyMessageForStatus(response.status, detailMessage, !auth),
    payload
  );
}

// ---------------------------------------------------------------------------
// Auth endpoints
// ---------------------------------------------------------------------------

export function register(email: string, password: string): Promise<{ id: string; email: string }> {
  return request("/api/users", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request("/api/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export async function logout(): Promise<void> {
  const currentRefreshToken = getRefreshToken();
  clearToken();

  if (!currentRefreshToken) return;

  try {
    await fetch(`${BASE_URL}/api/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: currentRefreshToken }),
    });
  } catch {
    // Best-effort — the token is already cleared locally either way.
  }
}

// ---------------------------------------------------------------------------
// Reset password endpoints
// ---------------------------------------------------------------------------

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return request("/api/password-reset/request", {
    method: "POST",
    body: { email },
    auth: false,
  });
}

export function confirmPasswordReset(token: string, newPassword: string): Promise<{ message: string }> {
  return request("/api/password-reset/confirm", {
    method: "POST",
    body: { token, new_password: newPassword },
    auth: false,
  });
}

// ---------------------------------------------------------------------------
// Application endpoints
// ---------------------------------------------------------------------------

export function getApplications(): Promise<Application[]> {
  return request("/api/applications");
}

export function getApplication(id: number | string): Promise<Application> {
  return request(`/api/applications/${id}`);
}

export function createApplication(input: CreateApplicationInput): Promise<Application> {
  return request("/api/applications", {
    method: "POST",
    body: input,
  });
}

export function updateApplication(
  id: number | string,
  input: UpdateApplicationInput
): Promise<Application> {
  return request(`/api/applications/${id}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteApplication(id: number | string): Promise<void> {
  return request(`/api/applications/${id}`, {
    method: "DELETE",
  });
}

export interface ImportPreview {
  company: string;
  position: string;
  location: string;
  salary: string | null;
  skills: string[];
}

export function importJobFromUrl(url: string): Promise<ImportPreview> {
  return request("/api/applications/import", {
    method: "POST",
    body: { url },
  });
}