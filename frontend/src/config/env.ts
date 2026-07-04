/** Production API origin — fallback when build env is missing or still points at localhost. */
const PRODUCTION_BACKEND_URL = "https://newjourney-api.onrender.com";

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Resolves API origin without the `/api` suffix.
 * Deployed sites never call localhost even if REACT_APP_BACKEND_URL was baked incorrectly.
 */
export function getBackendBaseUrl(): string {
  const fromBuild = process.env.REACT_APP_BACKEND_URL?.trim();
  const isProdBuild = process.env.NODE_ENV === "production";
  const onDeployedHost =
    typeof window !== "undefined" && !isLocalHost(window.location.hostname);

  if (fromBuild && !fromBuild.includes("localhost")) {
    return fromBuild.replace(/\/$/, "");
  }

  if (onDeployedHost || isProdBuild) {
    return PRODUCTION_BACKEND_URL;
  }

  return fromBuild?.replace(/\/$/, "") || "http://localhost:5102";
}

export const API_BASE = `${getBackendBaseUrl()}/api`;
