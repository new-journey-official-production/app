import React, { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Edit, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import AdminPagination from "@/components/admin/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const empty: ApiRow = { name: "", slug: "", icon: "", image: "" };

export default function AdminCategories() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApiRow | null>(null);
  const [form, setForm] = useState<ApiRow>({ ...empty });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    api.get("/admin/categories")
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch((e) => toast.error(apiError(e)));
  }, []);

  useEffect(() => { load(); }, [load]);

  const pagination = usePagination(items, 25, items.length);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...empty });
    setDialogOpen(true);
  };

  const openEdit = (cat: ApiRow) => {
    setEditing(cat);
    setForm({ ...empty, ...cat });
    setDialogOpen(true);
  };

  const uploadImage = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const { data } = await api.post("/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data?.id) {
        setForm((prev) => ({ ...prev, image: `${API_BASE}/admin/media/${data.id}` }));
        toast.success("Image uploaded");
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!form.name?.trim()) { toast.error("Name is required"); return; }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug?.trim() || undefined,
        icon: form.icon || "",
        image: form.image || "",
      };
      if (editing?.id) {
        await api.patch(`/admin/categories/${editing.id}`, payload);
        toast.success("Category updated");
      } else {
        await api.post("/admin/categories", payload);
        toast.success("Category created");
      }
      setDialogOpen(false);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this category? Products using it keep their category slug.")) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="p-6 lg:p-8" data-testid="admin-categories">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Shop categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage categories shown in the shop, navbar, and home page.</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" /> Add category
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Name</th>
              <th className="text-left p-3 font-medium">Slug</th>
              <th className="text-left p-3 font-medium hidden sm:table-cell">Icon</th>
              <th className="text-right p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagination.slice.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 font-mono-data text-muted-foreground">{c.slug}</td>
                <td className="p-3 hidden sm:table-cell text-muted-foreground">{c.icon || "—"}</td>
                <td className="p-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No categories yet.</td></tr>
            )}
          </tbody>
        </table>
        <AdminPagination {...pagination} onPageChange={pagination.setPage} />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <Field label="Slug (optional)" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} placeholder="auto-generated from name" />
            <Field label="Icon name (Lucide)" value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} placeholder="e.g. utensils" />
            <div>
              <Label className="text-xs text-muted-foreground">Cover image</Label>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadImage(e.target.files)} />
              <div className="flex gap-2 mt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
                </Button>
              </div>
              {form.image && (
                <div className="mt-2 h-20 w-32 rounded-lg overflow-hidden border bg-zinc-100">
                  <img src={form.image} alt="" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={busy || uploading}>{busy ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" {...rest} />
    </div>
  );
}
