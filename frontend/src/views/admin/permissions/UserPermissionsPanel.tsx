import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Search } from "lucide-react";
import { toast } from "sonner";
import PermissionMatrix from "@/components/SettingsComponents/PermissionMatrix";
import { RbacDao } from "@/common_assets/DataRepository/RbacDao";
import { bitsToMatrixPayload, dictToBits, mergeBits } from "@/lib/rbacHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RbacModule, User } from "@/types";

interface UserPermissionsPanelProps {
  modules: RbacModule[];
}

/** Admin UI — per-user permission overrides on top of role defaults. */
export default function UserPermissionsPanel({ modules }: UserPermissionsPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [overrideBits, setOverrideBits] = useState<Record<string, number>>({});
  const [roleBits, setRoleBits] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    RbacDao.listUsers()
      .then(setUsers)
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.includes(q),
    );
  }, [users, query]);

  const loadUser = useCallback(async (userId: string) => {
    try {
      const payload = await RbacDao.getUserPermissions(userId);
      setSelectedUser(payload.user);
      setRoleBits(payload.role_permissions ?? {});
      setOverrideBits(mergeBits(modules, payload.overrides ?? {}));
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load user permissions");
    }
  }, [modules]);

  useEffect(() => {
    if (selectedId) loadUser(selectedId);
  }, [selectedId, loadUser]);

  /** Modules with explicit overrides (highlighted in matrix). */
  const highlightModules = useMemo(
    () => new Set(Object.keys(overrideBits).filter((k) => (overrideBits[k] ?? 0) > 0)),
    [overrideBits],
  );

  /** Effective preview = role baseline merged with overrides. */
  const effectiveBits = useMemo(() => {
    const base = mergeBits(modules, roleBits);
    for (const [modId, bits] of Object.entries(overrideBits)) {
      if (bits > 0) base[modId] = bits;
    }
    return base;
  }, [modules, roleBits, overrideBits]);

  const handleChange = (moduleId: string, bits: number) => {
    setOverrideBits((prev) => ({ ...prev, [moduleId]: bits }));
    setDirty(true);
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await RbacDao.updateUserPermissions(selectedId, bitsToMatrixPayload(overrideBits));
      await RbacDao.reloadPermissions();
      await loadUser(selectedId);
      toast.success("User permission overrides saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const resetOverrides = async () => {
    if (!selectedId || !window.confirm("Clear all permission overrides for this user?")) return;
    setSaving(true);
    try {
      await RbacDao.updateUserPermissions(selectedId, []);
      await RbacDao.reloadPermissions();
      await loadUser(selectedId);
      toast.success("Overrides cleared — user inherits role permissions");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSaving(false);
    }
  };

  const copyEffectiveToOverrides = () => {
    const effective = dictToBits(
      Object.fromEntries(modules.map((m) => [m.module_id, effectiveBits[m.module_id] ?? 0])),
    );
    setOverrideBits(mergeBits(modules, effective));
    setDirty(true);
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8">Loading users…</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-6">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Users</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="rounded-xl border border-border bg-card max-h-[480px] overflow-y-auto divide-y">
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setSelectedId(u.id)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-accent ${
                selectedId === u.id ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : ""
              }`}
            >
              <div className="font-medium truncate">{u.name}</div>
              <div className={`text-xs truncate ${selectedId === u.id ? "opacity-80" : "text-muted-foreground"}`}>
                {u.email}
              </div>
              <div className={`text-[10px] uppercase tracking-wide mt-0.5 ${selectedId === u.id ? "opacity-70" : "text-muted-foreground"}`}>
                {u.role}
              </div>
            </button>
          ))}
          {!filtered.length && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">No users match</div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {selectedUser ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">{selectedUser.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Role: <span className="font-medium capitalize">{selectedUser.role}</span>
                  {selectedUser.role_id ? ` · overrides replace role defaults per module` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={resetOverrides} disabled={saving}>
                  <RotateCcw className="h-4 w-4" /> Clear overrides
                </Button>
                <Button variant="outline" size="sm" onClick={copyEffectiveToOverrides}>
                  Copy effective → overrides
                </Button>
                <Button
                  size="sm"
                  className="gap-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!dirty || saving}
                  onClick={save}
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save overrides"}
                </Button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground rounded-lg border border-dashed px-3 py-2">
              Orange rows have custom overrides. Unchecked modules inherit from the user&apos;s role.
              Admin accounts without a role assignment receive full access automatically.
            </p>

            <PermissionMatrix
              modules={modules}
              bitsByModule={overrideBits}
              onChange={handleChange}
              highlightModules={highlightModules}
            />
          </>
        ) : (
          <div className="text-sm text-muted-foreground py-12 text-center">Select a user to manage permission overrides</div>
        )}
      </div>
    </div>
  );
}
