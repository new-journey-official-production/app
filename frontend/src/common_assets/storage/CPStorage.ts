/** Persistent client state — location context and permission cache (CPStorage equivalent). */
import type { PermissionDict } from "@/types";

const LOCATION_KEY = "nj_l_id";
const MODULE_KEY = "nj_module_id";
const PERMS_KEY = "nj_user_permissions";

export function getCurrentLocationId(): string {
  return localStorage.getItem(LOCATION_KEY) || "default";
}

export function setCurrentLocationId(lid: string): void {
  localStorage.setItem(LOCATION_KEY, lid);
}

export function getCurrentModuleId(): string {
  return sessionStorage.getItem(MODULE_KEY) || "";
}

export function setCurrentModuleId(moduleId: string): void {
  if (moduleId) sessionStorage.setItem(MODULE_KEY, moduleId);
  else sessionStorage.removeItem(MODULE_KEY);
}

export function saveUserPermissions(dict: PermissionDict): void {
  localStorage.setItem(PERMS_KEY, JSON.stringify(dict || {}));
}

export function loadUserPermissions(): PermissionDict {
  try {
    const raw = localStorage.getItem(PERMS_KEY);
    return raw ? (JSON.parse(raw) as PermissionDict) : {};
  } catch {
    return {};
  }
}

export function clearUserPermissions(): void {
  localStorage.removeItem(PERMS_KEY);
}
