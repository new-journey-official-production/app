import React, { useCallback, useEffect, useState } from "react";
import {
  Plus, Edit, Trash2, Copy, Archive, Eye, EyeOff, RotateCcw, ChevronRight, ChevronDown, GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const emptyCategory: ApiRow = {
  name: "",
  slug: "",
  parent_id: null,
  short_description: "",
  long_description: "",
  banner: "",
  cover_image: "",
  icon: "",
  seo_title: "",
  seo_description: "",
  status: "active",
  display_order: 0,
  featured: false,
  visibility: "visible",
};

export default function B2bCategories() {
  const [tree, setTree] = useState<ApiRow[]>([]);
  const [flat, setFlat] = useState<ApiRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiRow | null>(null);
  const [form, setForm] = useState<ApiRow>({ ...emptyCategory });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get("/admin/b2b/categories", { params: { include_archived: true, tree: true } })
      .then((r) => {
        setTree(r.data.items || []);
        setFlat(r.data.flat || []);
      })
      .catch((e) => toast.error(apiError(e)));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = (parentId?: string) => {
    setEditing(null);
    setForm({ ...emptyCategory, parent_id: parentId || null, display_order: flat.length });
    setDialogOpen(true);
  };

  const openEdit = (cat: ApiRow) => {
    setEditing(cat);
    setForm({ ...emptyCategory, ...cat });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    try {
      const payload: ApiRow = {
        name: form.name.trim(),
        parent_id: form.parent_id || null,
        short_description: form.short_description || "",
        long_description: form.long_description || "",
        banner: form.banner || "",
        cover_image: form.cover_image || "",
        icon: form.icon || "",
        seo_title: form.seo_title || "",
        seo_description: form.seo_description || "",
        status: form.status || "active",
        display_order: Number(form.display_order) || 0,
        featured: !!form.featured,
        visibility: form.visibility || "visible",
      };
      if (form.slug?.trim()) payload.slug = form.slug.trim();

      if (editing?.id) {
        await api.patch(`/admin/b2b/categories/${editing.id}`, payload);
        toast.success("Category updated");
      } else {
        await api.post("/admin/b2b/categories", payload);
        toast.success("Category created");
      }
      setDialogOpen(false);
      load();
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  const patchStatus = async (id: string, patch: ApiRow) => {
    try {
      await api.patch(`/admin/b2b/categories/${id}`, patch);
      toast.success("Updated");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const duplicate = async (id: string) => {
    try {
      await api.post(`/admin/b2b/categories/${id}/duplicate`);
      toast.success("Category duplicated");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this category? Products may lose their category link.")) return;
    try {
      await api.delete(`/admin/b2b/categories/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const moveOrder = async (cat: ApiRow, delta: number) => {
    const newOrder = Math.max(0, (cat.display_order ?? 0) + delta);
    await patchStatus(cat.id, { display_order: newOrder });
  };

  return (
    <div className="p-6 lg:p-8" data-testid="b2b-categories">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">B2B Categories</h1>
          <div className="text-sm text-muted-foreground">{flat.length} categories</div>
        </div>
        <Button onClick={() => openCreate()} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" /> New category
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {tree.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No categories yet. Create your first one.</div>
        ) : (
          <div className="divide-y divide-border">
            {tree.map((cat) => (
              <CategoryRow
                key={cat.id}
                cat={cat}
                depth={0}
                onEdit={openEdit}
                onCreateChild={openCreate}
                onDuplicate={duplicate}
                onDelete={remove}
                onPatch={patchStatus}
                onMove={moveOrder}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Slug (optional)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
            <div>
              <Label className="text-xs text-muted-foreground">Parent category</Label>
              <Select value={form.parent_id || "__none__"} onValueChange={(v) => setForm({ ...form, parent_id: v === "__none__" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None (root)</SelectItem>
                  {flat.filter((c) => c.id !== editing?.id).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field label="Short description" value={form.short_description} onChange={(v) => setForm({ ...form, short_description: v })} />
            <div>
              <Label className="text-xs text-muted-foreground">Long description</Label>
              <textarea rows={3} value={form.long_description || ""} onChange={(e) => setForm({ ...form, long_description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <Field label="Cover image URL" value={form.cover_image} onChange={(v) => setForm({ ...form, cover_image: v })} />
            <Field label="Icon" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Visibility</Label>
                <Select value={form.visibility || "visible"} onValueChange={(v) => setForm({ ...form, visibility: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visible">Visible</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Field label="Display order" type="number" value={form.display_order} onChange={(v) => setForm({ ...form, display_order: v })} />
            <div className="flex items-center justify-between">
              <Label>Featured</Label>
              <Switch checked={!!form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
            </div>
            <Field label="SEO title" value={form.seo_title} onChange={(v) => setForm({ ...form, seo_title: v })} />
            <Field label="SEO description" value={form.seo_description} onChange={(v) => setForm({ ...form, seo_description: v })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-orange-600 hover:bg-orange-700">{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryRow({
  cat, depth, onEdit, onCreateChild, onDuplicate, onDelete, onPatch, onMove,
}: {
  cat: ApiRow;
  depth: number;
  onEdit: (c: ApiRow) => void;
  onCreateChild: (parentId: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onPatch: (id: string, patch: ApiRow) => void;
  onMove: (cat: ApiRow, delta: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const children = (cat.children as ApiRow[]) || [];
  const isArchived = cat.status === "archived";
  const isHidden = cat.visibility === "hidden";

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 hover:bg-accent/50 transition" style={{ paddingLeft: 16 + depth * 24 }}>
        <GripVertical className="h-4 w-4 text-muted-foreground flex-none" />
        {children.length > 0 ? (
          <button type="button" onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : <span className="w-5" />}
        <div className="flex-1 min-w-0">
          <div className="font-medium flex items-center gap-2 flex-wrap">
            {cat.name}
            {isArchived && <span className="text-[10px] uppercase bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded">Archived</span>}
            {isHidden && <span className="text-[10px] uppercase bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 rounded">Hidden</span>}
            {cat.featured && <span className="text-[10px] uppercase bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 px-1.5 py-0.5 rounded">Featured</span>}
          </div>
          <div className="text-xs text-muted-foreground">{cat.slug} · order {cat.display_order ?? 0}</div>
        </div>
        <div className="flex items-center gap-1 flex-none">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Move up" onClick={() => onMove(cat, -1)}>↑</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Move down" onClick={() => onMove(cat, 1)}>↓</Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Add child" onClick={() => onCreateChild(cat.id)}><Plus className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cat)}><Edit className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(cat.id)}><Copy className="h-4 w-4" /></Button>
          {isArchived ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Restore" onClick={() => onPatch(cat.id, { status: "active" })}><RotateCcw className="h-4 w-4" /></Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Archive" onClick={() => onPatch(cat.id, { status: "archived" })}><Archive className="h-4 w-4" /></Button>
          )}
          {isHidden ? (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Show" onClick={() => onPatch(cat.id, { visibility: "visible" })}><Eye className="h-4 w-4" /></Button>
          ) : (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Hide" onClick={() => onPatch(cat.id, { visibility: "hidden" })}><EyeOff className="h-4 w-4" /></Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => onDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      {expanded && children.map((child) => (
        <CategoryRow
          key={child.id}
          cat={child}
          depth={depth + 1}
          onEdit={onEdit}
          onCreateChild={onCreateChild}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onPatch={onPatch}
          onMove={onMove}
        />
      ))}
    </>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string | number | null | undefined; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}{required ? " *" : ""}</Label>
      <input type={type} value={value ?? ""} required={required} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
    </div>
  );
}
