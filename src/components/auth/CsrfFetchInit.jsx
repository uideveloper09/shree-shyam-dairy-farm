"use client";

import { useEffect } from "react";
import { AUTH_COOKIE } from "@/constants/auth";

function readCsrfToken() {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE.csrf}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function isMutation(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes((method || "GET").toUpperCase());
}

function isSameOriginApi(url) {
  if (url.startsWith("/api/")) return true;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin && parsed.pathname.startsWith("/api/");
  } catch {
    return false;
  }
}

/** Patches window.fetch so legacy call sites automatically send CSRF on API mutations. */
export default function CsrfFetchInit() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

      if (isSameOriginApi(url) && isMutation(init?.method)) {
        const csrf = readCsrfToken();
        if (csrf) {
          const headers = new Headers(init?.headers);
          if (!headers.has("X-CSRF-Token")) {
            headers.set("X-CSRF-Token", csrf);
          }
          return originalFetch(input, {
            ...init,
            headers,
            credentials: init?.credentials ?? "include",
          });
        }
      }

      return originalFetch(input, init);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
