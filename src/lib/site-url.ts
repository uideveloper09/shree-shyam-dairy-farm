import { PUBLIC_API_BASE } from "@/lib/api/versioning";

const LOCAL_SITE_URL = "http://localhost:3000";
const PRODUCTION_SITE_URL = "https://kunwardairy.com";

/** Internal App Router API prefix (auth, cart, subscriptions, etc.). */
export const APP_API_BASE = "/api/v1";

/** Canonical public website origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    (process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : LOCAL_SITE_URL);
  return raw.replace(/\/$/, "");
}

/** Same-origin internal API — e.g. https://kunwardairy.com/api/v1 */
export function getAppApiBaseUrl(): string {
  return `${getSiteUrl()}${APP_API_BASE}`;
}

/** Developer/public API — e.g. https://kunwardairy.com/api/public/v1 */
export function getPublicApiBaseUrl(): string {
  return `${getSiteUrl()}${PUBLIC_API_BASE}`;
}

/** Hostname for tenant subdomain resolution (e.g. farm1.kunwardairy.com). */
export function getAppDomain(): string {
  return (
    process.env.NEXT_PUBLIC_APP_DOMAIN?.trim() ||
    new URL(getSiteUrl()).hostname ||
    "kunwardairy.com"
  );
}

export { LOCAL_SITE_URL, PRODUCTION_SITE_URL };
