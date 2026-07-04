/** CP-style HTTP client — adds Authorization, moduleID, and l_id headers on every request. */
import axios, { type AxiosError } from "axios";
import { getCurrentLocationId, getCurrentModuleId } from "../../../storage/CPStorage";
import type { ApiResponse, ValidationErrorDetail } from "@/types";

const BASE_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5102";
export const API_BASE = `${BASE_URL}/api`;

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

interface ErrorDetailObject {
  msg?: string;
}

export function apiError(e: unknown): string {
  const err = e as AxiosError<ApiResponse>;
  const detail = err?.response?.data?.detail ?? err?.response?.data?.message;
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
