import axios from "axios";

const BASE_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BASE_URL}/api`;

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function apiError(e) {
  const detail = e?.response?.data?.detail;
  if (detail == null) return e?.message || "Something went wrong";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((x) => x?.msg || JSON.stringify(x)).join(", ");
  if (typeof detail === "object" && detail.msg) return detail.msg;
  return String(detail);
}
