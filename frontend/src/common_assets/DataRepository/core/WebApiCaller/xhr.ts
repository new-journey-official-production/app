/** CP-style HTTP client — sends moduleID, l_id, and httpOnly cookie credentials on every request. */
import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { getCurrentLocationId, getCurrentModuleId } from "../../../storage/CPStorage";
import type { ApiResponse, ValidationErrorDetail } from "@/types";
import { API_BASE } from "@/config/env";

export { API_BASE };

const xhr = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

xhr.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const lid = getCurrentLocationId();
  if (lid) config.headers["l_id"] = lid;
  const moduleId = config.headers["moduleID"] || getCurrentModuleId();
  if (moduleId) config.headers["moduleID"] = moduleId;
  return config;
});

/** Single in-flight refresh so parallel 401s don't stampede the refresh endpoint. */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
      .then(() => true)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

/** On 401, attempt one silent token refresh then retry the original request. */
xhr.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    if (!config || error.response?.status !== 401) throw error;

    const url = config.url ?? "";
    if (
      config._retried ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register")
    ) {
      throw error;
    }

    const refreshed = await tryRefreshSession();
    if (!refreshed) throw error;

    config._retried = true;
    return xhr(config);
  },
);

interface ErrorDetailObject {
  msg?: string;
}

/** Maps API, auth, and network failures to user-friendly messages. */
export function apiError(e: unknown): string {
  const err = e as AxiosError<ApiResponse>;
  const status = err?.response?.status;
  const detail = err?.response?.data?.detail ?? err?.response?.data?.message;

  if (status === 401) {
    return typeof detail === "string" && detail
      ? detail
      : "Your session expired — please sign in again.";
  }
  if (status === 403) {
    return typeof detail === "string" && detail
      ? detail
      : "You don't have permission for this action.";
  }
  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error") {
    return "Connection problem — check your internet and try again.";
  }

  if (detail == null) return err?.message || "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((x: ValidationErrorDetail) => x?.msg || JSON.stringify(x)).join(", ");
  }
  if (typeof detail === "object" && (detail as ErrorDetailObject).msg) {
    return (detail as ErrorDetailObject).msg!;
  }
  return String(detail);
}

/** Unwrap CP-style { status, result } responses when present. */
export function unwrapResponse<T>(data: ApiResponse<T> | T): T {
  if (data && typeof data === "object" && "status" in data && (data as ApiResponse<T>).status === "success" && "result" in data) {
    return (data as ApiResponse<T>).result as T;
  }
  return data as T;
}

export default xhr;
