/**
 * RBAC bitmask helpers — convert between API shapes and matrix editor state.
 */
import { CPPermissions } from "@/common_assets/Constants/permissions";
import type { PermissionDict, PermissionMatrixItem, PermissionValue, RbacModule } from "@/types";

const OPS = [
  { key: "read", bit: CPPermissions.READ, label: "Read" },
  { key: "create", bit: CPPermissions.CREATE, label: "Create" },
  { key: "update", bit: CPPermissions.UPDATE, label: "Update" },
  { key: "delete", bit: CPPermissions.DELETE, label: "Delete" },
  { key: "hidden", bit: CPPermissions.HIDDEN, label: "Hidden" },
] as const;

export { OPS as PERMISSION_OPS };

/** Resolve numeric bits from API permission value. */
export function resolveBits(value: PermissionValue | undefined): number {
  if (value == null) return 0;
  return typeof value === "object" ? value.permission : value;
}

/** Flatten PermissionDict to moduleId → bits. */
export function dictToBits(dict: PermissionDict | Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [modId, val] of Object.entries(dict ?? {})) {
    out[modId] = typeof val === "number" ? val : resolveBits(val as PermissionValue);
  }
  return out;
}

/** Build API payload entries from a bits map. */
export function bitsToMatrixPayload(bits: Record<string, number>): PermissionMatrixItem[] {
  return Object.entries(bits)
    .filter(([, b]) => b > 0)
    .map(([module_id, permission_bits]) => ({ module_id, permission_bits }));
}

/** Toggle one permission flag on a bitmask. */
export function toggleBit(bits: number, flag: number, enabled: boolean): number {
  return enabled ? bits | flag : bits & ~flag;
}

export function hasBit(bits: number, flag: number): boolean {
  return (bits & flag) === flag;
}

/** Group modules by metadata.group for matrix sections. */
export function groupModules(modules: RbacModule[]): Record<string, RbacModule[]> {
  const groups: Record<string, RbacModule[]> = {};
  for (const mod of modules) {
    const group = String(mod.metadata?.group ?? "other");
    if (!groups[group]) groups[group] = [];
    groups[group].push(mod);
  }
  const order = ["admin", "customer", "public", "other"];
  const sorted: Record<string, RbacModule[]> = {};
  for (const key of order) {
    if (groups[key]?.length) sorted[key] = groups[key];
  }
  for (const key of Object.keys(groups)) {
    if (!sorted[key]) sorted[key] = groups[key];
  }
  return sorted;
}

export function groupLabel(group: string): string {
  const labels: Record<string, string> = {
    admin: "Admin panel",
    customer: "Customer account",
    public: "Storefront",
    other: "Other",
  };
  return labels[group] ?? group;
}

/** Initialize matrix bits for all modules (defaults to 0). */
export function emptyBitsForModules(modules: RbacModule[]): Record<string, number> {
  return Object.fromEntries(modules.map((m) => [m.module_id, 0]));
}

/** Merge source bits into a full module map. */
export function mergeBits(modules: RbacModule[], source: Record<string, number>): Record<string, number> {
  const base = emptyBitsForModules(modules);
  for (const [modId, bits] of Object.entries(source)) {
    if (modId in base) base[modId] = bits;
  }
  return base;
}
