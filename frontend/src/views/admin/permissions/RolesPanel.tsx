import React, { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PermissionMatrix from "@/components/SettingsComponents/PermissionMatrix";
import { RbacDao } from "@/common_assets/DataRepository/RbacDao";
import { bitsToMatrixPayload, mergeBits } from "@/lib/rbacHelpers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RbacModule, RbacRole } from "@/types";

interface RolesPanelProps {
  modules: RbacModule[];
}

/** Admin UI — create roles and edit role permission matrices. */
export default function RolesPanel({ modules }: RolesPanelProps) {
  const [roles, setRoles] = useState<RbacRole[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [bits, setBits] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: "", description: "" });

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const list = await RbacDao.listRoles();
      setRoles(list);
      if (!selectedId && list.length) setSelectedId(list[0].id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  useEffect(() => {
    const role = roles.find((r) => r.id === selectedId);
    if (!role) return;
    setBits(mergeBits(modules, role.permissions ?? {}));
    setDirty(false);
  }, [selectedId, roles, modules]);

  const selected = roles.find((r) => r.id === selectedId);

  const handleChange = (moduleId: string, nextBits: number) => {
    setBits((prev) => ({ ...prev, [moduleId]: nextBits }));
    setDirty(true);
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const updated = await RbacDao.updateRolePermissions(selectedId, bitsToMatrixPayload(bits));
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedId ? { ...r, permissions: updated } : r)),
      );
      await RbacDao.reloadPermissions();
      setDirty(false);
      toast.success("Role permissions saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.name.trim()) return;
    try {
      const role = await RbacDao.createRole({
        name: newRole.name.trim(),
        description: newRole.description.trim(),
      });
      toast.success(`Role "${role.name}" created`);
      setCreateOpen(false);
      setNewRole({ name: "", description: "" });
      await loadRoles();
      setSelectedId(role.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Create failed");
    }
  };

  const remove = async () => {
    if (!selected || !window.confirm(`Delete role "${selected.name}"?`)) return;
    try {
      await RbacDao.deleteRole(selected.id);
      toast.success("Role deleted");
      setSelectedId("");
      await loadRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (loading && !roles.length) {
    return <div className="text-sm text-muted-foreground py-8">Loading roles…</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Roles</h2>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <Plus className="h-3.5 w-3.5" /> New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create role</DialogTitle></DialogHeader>
              <form onSubmit={create} className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <Input value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} required />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Description</label>
                  <Textarea value={newRole.description} onChange={(e) => setNewRole({ ...newRole, description: e.target.value })} rows={2} />
                </div>
                <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border border-border bg-card divide-y overflow-hidden">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedId(role.id)}
              className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-accent ${
                selectedId === role.id ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : ""
              }`}
            >
              <div className="font-medium">{role.name}</div>
              <div className={`text-xs truncate ${selectedId === role.id ? "opacity-80" : "text-muted-foreground"}`}>
                {role.slug}
              </div>
            </button>
          ))}
          {!roles.length && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">No roles yet</div>
          )}
        </div>

        <Button variant="ghost" size="sm" className="w-full gap-2" onClick={loadRoles}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="min-w-0 space-y-4">
        {selected ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">{selected.description || "No description"}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1 text-destructive" onClick={remove}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button
                  size="sm"
                  className="gap-1 bg-orange-600 hover:bg-orange-700"
                  disabled={!dirty || saving}
                  onClick={save}
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save permissions"}
                </Button>
              </div>
            </div>
            <PermissionMatrix modules={modules} bitsByModule={bits} onChange={handleChange} />
          </>
        ) : (
          <div className="text-sm text-muted-foreground py-12 text-center">Select a role to edit permissions</div>
        )}
      </div>
    </div>
  );
}
