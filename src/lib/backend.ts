export const API_BASE_URL = "/backend-api";
export const AUTH_STORAGE_KEY = "sashvi_auth_access_token";
export const REFRESH_STORAGE_KEY = "sashvi_auth_refresh_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
}

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_STORAGE_KEY);
}

export function setAuthTokens(access: string, refresh: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_STORAGE_KEY, access);
  window.localStorage.setItem(REFRESH_STORAGE_KEY, refresh);
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_STORAGE_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) return null;
    const access = body.access || body.token;
    if (access && body.refresh) {
      setAuthTokens(access, body.refresh);
      return access;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiJson<T = unknown>(path: string, init: RequestInit = {}, auth = false) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (auth && response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
    }
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errBody = body as { error?: string; detail?: string };
    throw new Error(errBody.detail || errBody.error || "Server request failed");
  }

  return body as T;
}
