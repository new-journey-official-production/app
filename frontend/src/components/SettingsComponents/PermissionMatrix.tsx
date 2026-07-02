/**
 * Reusable module × permission-bit checkbox grid (CP RBAC pattern).
 */
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { groupLabel, groupModules, hasBit, PERMISSION_OPS, toggleBit } from "@/lib/rbacHelpers";
import type { RbacModule } from "@/types";

interface PermissionMatrixProps {
  modules: RbacModule[];
  bitsByModule: Record<string, number>;
  onChange: (moduleId: string, bits: number) => void;
  disabled?: boolean;
  /** Highlight modules that differ from baseline (user overrides). */
  highlightModules?: Set<string>;
}

export default function PermissionMatrix({
  modules,
  bitsByModule,
  onChange,
  disabled = false,
  highlightModules,
}: PermissionMatrixProps) {
  const grouped = groupModules(modules);

  const setAllForModule = (moduleId: string, enabled: boolean) => {
    const crudMask = PERMISSION_OPS.filter((o) => o.key !== "hidden").reduce((m, o) => m | o.bit, 0);
    onChange(moduleId, enabled ? crudMask : 0);
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([group, mods]) => (
        <div key={group} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {groupLabel(group)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium min-w-[180px]">Module</th>
                  <th className="px-2 py-2 font-medium w-16 text-center">All</th>
                  {PERMISSION_OPS.map((op) => (
                    <th key={op.key} className="px-2 py-2 font-medium w-16 text-center">{op.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mods.map((mod) => {
                  const bits = bitsByModule[mod.module_id] ?? 0;
                  const crudMask = PERMISSION_OPS.filter((o) => o.key !== "hidden").reduce((m, o) => m | o.bit, 0);
                  const allCrud = (bits & crudMask) === crudMask;
                  const highlighted = highlightModules?.has(mod.module_id);

                  return (
                    <tr
                      key={mod.module_id}
                      className={`border-b last:border-0 ${highlighted ? "bg-orange-50/50 dark:bg-orange-950/20" : ""}`}
                    >
                      <td className="px-4 py-2">
                        <div className="font-medium">{mod.name}</div>
                        <div className="text-[10px] font-mono-data text-muted-foreground truncate max-w-[220px]">{mod.module_id}</div>
                      </td>
                      <td className="px-2 py-2 text-center">
                        <Checkbox
                          checked={allCrud}
                          disabled={disabled}
                          onCheckedChange={(v) => setAllForModule(mod.module_id, v === true)}
                        />
                      </td>
                      {PERMISSION_OPS.map((op) => (
                        <td key={op.key} className="px-2 py-2 text-center">
                          <Checkbox
                            checked={hasBit(bits, op.bit)}
                            disabled={disabled}
                            onCheckedChange={(v) =>
                              onChange(mod.module_id, toggleBit(bits, op.bit, v === true))
                            }
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
