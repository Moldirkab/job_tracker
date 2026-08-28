import type {
  Application,
  AuthResponse,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "../types/application";

const BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "token";

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
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
    case 500:
      return "Something went wrong on our end. Please try again shortly.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
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

  return payload as T;
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
