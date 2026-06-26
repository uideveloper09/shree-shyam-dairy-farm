export const API_VERSIONS = ["v1"] as const;
export type ApiVersion = (typeof API_VERSIONS)[number];
export const CURRENT_API_VERSION: ApiVersion = "v1";

export const PUBLIC_API_BASE = "/api/public/v1";

export function getVersionFromPath(pathname: string): ApiVersion | null {
  const match = pathname.match(/\/api\/public\/(v\d+)\//);
  if (!match) return null;
  const version = match[1] as ApiVersion;
  return API_VERSIONS.includes(version) ? version : null;
}

export function apiVersionHeaders(version: ApiVersion = CURRENT_API_VERSION) {
  return {
    "X-API-Version": version,
    "X-API-Deprecated": "false",
  };
}
