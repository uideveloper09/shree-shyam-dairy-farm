/**
 * Browser fetch helper — sends session cookies, CSRF token, and refreshes expired access tokens.
 */
import { AUTH_COOKIE } from "@/constants/auth";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getCsrfTokenFromDocument(): string | null {
  return readCookie(AUTH_COOKIE.csrf);
}

function isMutation(method?: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes((method || "GET").toUpperCase());
}

function withCsrfHeaders(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  if (isMutation(init.method)) {
    const csrf = getCsrfTokenFromDocument();
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }
  return { ...init, headers };
}

export async function refreshSession(): Promise<boolean> {
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "include",
    ...withCsrfHeaders({ method: "POST" }),
  });
  return res.ok;
}

export async function fetchWithSession(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const options: RequestInit = { ...withCsrfHeaders(init), credentials: "include" };

  if (url.includes("/billing")) {
    console.log("[AutoPay] fetchWithSession() start", { url, method: options.method || "GET" });
  }

  let response = await fetch(input, options);

  if (url.includes("/billing")) {
    console.log("[AutoPay] fetchWithSession() first response", {
      url,
      status: response.status,
    });
  }

  if (response.status === 401) {
    if (url.includes("/billing")) {
      console.warn("[AutoPay] fetchWithSession() 401 — attempting session refresh", { url });
    }
    const refreshed = await refreshSession();
    if (url.includes("/billing")) {
      console.log("[AutoPay] fetchWithSession() refresh result", { url, refreshed });
    }
    if (refreshed) {
      response = await fetch(input, { ...withCsrfHeaders(init), credentials: "include" });
      if (url.includes("/billing")) {
        console.log("[AutoPay] fetchWithSession() retry response", {
          url,
          status: response.status,
        });
      }
    }
  }

  return response;
}

/** Drop-in fetch wrapper that adds CSRF + credentials for mutations. */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  return fetch(input, { ...withCsrfHeaders(init), credentials: "include" });
}
