/**
 * CP-style permission utilities — bitmask RBAC for UI gating.
 */
import React from "react";
import { CPPermissions } from "@/common_assets/Constants/permissions";
import { loadUserPermissions, saveUserPermissions } from "@/common_assets/storage/CPStorage";
import { RbacDao } from "@/common_assets/DataRepository/RbacDao";
import type { PermissionDict, PermissionValue } from "@/types";

function resolvePermissionBits(value: PermissionValue): number {
  return typeof value === "object" ? value.permission : value;
}

/** Check module permission: (userBits & requiredBits) === requiredBits */
export function hasPermission(
  moduleId: string,
  op: number,
  permissionDict?: PermissionDict,
): boolean {
  const dict = permissionDict ?? loadUserPermissions();
  if (dict?.[moduleId] != null) {
    const bits = resolvePermissionBits(dict[moduleId]);
    return (bits & op) === op;
  }
  return false;
}

/** Field-level: absent module = allowed (CP convention). */
export function hasFieldPermission(
  moduleId: string,
  op: number,
  fieldDict?: PermissionDict,
): boolean {
  const dict = fieldDict ?? loadUserPermissions();
  if (dict?.[moduleId] == null) return true;
  const bits = resolvePermissionBits(dict[moduleId]);
  return (bits & op) === op;
}

/** Fetch and cache permissions from API. */
export async function fetchAndStorePermissions(): Promise<PermissionDict> {
  try {
    const perms = await RbacDao.getMyPermissions();
    saveUserPermissions(perms);
    return perms;
  } catch {
    return loadUserPermissions();
  }
}

interface CLAuthConfig {
  moduleID: string;
  OP?: number;
}

/**
 * HOC — renders null when user lacks permission.
 * Usage: CLAuth({ moduleID, OP })(MyComponent)
 */
export function CLAuth({ moduleID, OP = CPPermissions.READ }: CLAuthConfig) {
  return function wrap<P extends object>(WrappedComponent: React.ComponentType<P>) {
    return function CLAuthWrapper(props: P) {
      if (!hasPermission(moduleID, OP)) return null;
      return <WrappedComponent {...props} />;
    };
  };
}

export { CPPermissions };
