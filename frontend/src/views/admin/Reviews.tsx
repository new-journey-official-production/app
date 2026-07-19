import React, { useEffect, useState } from "react";
import { Star, Edit } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import AdminPaginatedPanel from "@/components/admin/AdminPaginatedPanel";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminReviews() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [edit, setEdit] = useState<ApiRow | null>(null);
  const [form, setForm] = useState({ title: "", comment: "", rating: 5 });

  const load = () => api.get("/reviews").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const pagination = usePagination(items, 25, items.length);

  const toggle = async (id, approved) => {
    try { await api.patch(`/reviews/${id}`, { approved }); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  const openEdit = (r: ApiRow) => {
    setEdit(r);
    setForm({ title: r.title || "", comment: r.comment || "", rating: r.rating ?? 5 });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!edit) return;
    try {
      await api.patch(`/reviews/${edit.id}`, form);
      toast.success("Review updated");
      setEdit(null);
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Reviews</h1>
      <div className="text-sm text-muted-foreground mb-6">{items.length} customer reviews</div>
      <AdminPaginatedPanel pagination={pagination}>
        <div className="divide-y divide-border">
        {pagination.slice.map((r) => (
          <div key={r.id} className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold">{r.user_name}</div>
                <div className="text-xs text-muted-foreground">{r.title}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.approved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800"}`}>{r.approved ? "Approved" : "Pending"}</span>
                <Button size="sm" variant="outline" onClick={() => openEdit(r)} className="gap-1"><Edit className="h-3.5 w-3.5" /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => toggle(r.id, !r.approved)}>{r.approved ? "Unapprove" : "Approve"}</Button>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{r.comment}</div>
          </div>
        ))}
        </div>
      </AdminPaginatedPanel>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit review</DialogTitle></DialogHeader>
          <form onSubmit={saveEdit} className="space-y-3">
            <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
            <Field label="Rating (1–5)" type="number" min={1} max={5} value={form.rating} onChange={(v) => setForm({ ...form, rating: Number(v) })} />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Comment</label>
              <textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <Button type="submit" className="w-full">Save changes</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...rest} />
    </div>
  );
}
