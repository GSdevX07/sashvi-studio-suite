export const API_BASE_URL = "/backend-api";
export const AUTH_STORAGE_KEY = "sashvi_auth_access_token";
export const REFRESH_STORAGE_KEY = "sashvi_auth_refresh_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_STORAGE_KEY);
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

export async function apiJson<T = any>(path: string, init: RequestInit = {}, auth = false) {
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.error || "Server request failed");
  }

  return body as T;
}
