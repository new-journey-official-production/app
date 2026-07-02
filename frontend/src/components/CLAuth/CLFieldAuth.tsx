/** Field-level permission wrapper — hide/disable by flds_* module IDs. */
import type { ReactNode } from "react";
import { hasFieldPermission } from "./CLAuth";
import { CPPermissions } from "@/common_assets/Constants/permissions";

interface CLFieldAuthProps {
  moduleID: string;
  OP?: number;
  children: ReactNode;
  fallback?: ReactNode;
}

export function CLFieldAuth({
  moduleID,
  OP = CPPermissions.READ,
  children,
  fallback = null,
}: CLFieldAuthProps) {
  if (!hasFieldPermission(moduleID, OP)) return fallback;
  return children;
}
