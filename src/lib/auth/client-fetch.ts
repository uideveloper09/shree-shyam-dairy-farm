/**
 * Browser fetch helper — sends session cookies and refreshes expired access tokens.
 */
export async function refreshSession(): Promise<boolean> {
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
}

export async function fetchWithSession(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const options: RequestInit = { ...init, credentials: "include" };
  let response = await fetch(input, options);

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(input, options);
    }
  }

  return response;
}
