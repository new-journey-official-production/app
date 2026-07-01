import React, { useEffect, useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

const empty = { title: "", slug: "", excerpt: "", content: "", cover_image: "", tags: [], is_published: true };

export default function AdminBlog() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [tagsInput, setTagsInput] = useState("");
  const [editingId, setEditingId] = useState(null);

  const load = () => api.get("/blog").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...f, tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean) };
      if (editingId) await api.patch(`/blog/${editingId}`, payload);
      else await api.post("/blog", payload);
      toast.success("Saved");
      setOpen(false); setF(empty); setEditingId(null); setTagsInput("");
      load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const edit = (p) => { setF(p); setTagsInput((p.tags || []).join(", ")); setEditingId(p.id); setOpen(true); };
  const del = async (id) => { if (window.confirm("Delete?")) { await api.delete(`/blog/${id}`); load(); } };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Journal</h1>
          <div className="text-sm text-muted-foreground">{items.length} posts</div>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setF(empty); setEditingId(null); setTagsInput(""); } }}>
          <DialogTrigger asChild><Button className="gap-2 bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4" /> New post</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Edit post" : "New post"}</DialogTitle></DialogHeader>
            <form onSubmit={save} className="space-y-3">
              <Field label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v })} required />
              <Field label="Slug (optional)" value={f.slug || ""} onChange={(v) => setF({ ...f, slug: v })} />
              <Field label="Cover image URL" value={f.cover_image || ""} onChange={(v) => setF({ ...f, cover_image: v })} />
              <Field label="Excerpt" value={f.excerpt} onChange={(v) => setF({ ...f, excerpt: v })} />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Content</label>
                <textarea rows={8} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </div>
              <Field label="Tags (comma separated)" value={tagsInput} onChange={setTagsInput} />
              <div className="flex items-center justify-between">
                <label className="text-sm">Published</label>
                <Switch checked={f.is_published} onCheckedChange={(v) => setF({ ...f, is_published: v })} />
              </div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
            {p.cover_image && <div className="aspect-video overflow-hidden bg-zinc-100 dark:bg-zinc-800"><img src={p.cover_image} alt="" className="h-full w-full object-cover" /></div>}
            <div className="p-4">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{p.tags?.join(" · ")}</div>
              <div className="mt-1 font-display font-semibold">{p.title}</div>
              <div className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.excerpt}</div>
              <div className="mt-3 flex gap-1 justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => edit(p)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
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
