import React, { useEffect, useRef, useState } from "react";
import { Upload, Copy, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import AdminPagination from "@/components/admin/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";

export default function AdminMedia() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => api.get("/admin/media").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const upload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        await api.post("/admin/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      }
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
      load();
    } catch (e) { toast.error(apiError(e)); }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); toast.success("URL copied to clipboard"); }
    catch { toast.error("Copy failed"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this image? Products referencing it will show broken links.")) return;
    try { await api.delete(`/admin/media/${id}`); load(); toast.success("Deleted"); }
    catch (e) { toast.error(apiError(e)); }
  };

  const fmtSize = (n) => n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`;

  const pagination = usePagination(items, 25, items.length);

  return (
    <div className="p-6 lg:p-8" data-testid="admin-media">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Media library</h1>
          <div className="text-sm text-muted-foreground">{items.length} files · uploads are stored in MongoDB (swap to object storage later)</div>
        </div>
        <div>
          <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} data-testid="media-upload-input" />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2 bg-orange-600 hover:bg-orange-700" data-testid="media-upload-btn">
            <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      <label
        htmlFor="media-drop"
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); upload(e.dataTransfer.files); }}
        className="mb-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border p-10 text-center cursor-pointer hover:border-orange-500 transition"
      >
        <input id="media-drop" type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
        <Upload className="h-6 w-6 text-muted-foreground mb-2" />
        <div className="font-display font-semibold">Drop images here or click to upload</div>
        <div className="text-xs text-muted-foreground mt-1">PNG · JPG · WebP · SVG — max 3 MB each</div>
      </label>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">No media yet. Upload something.</div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4" data-testid="media-grid">
          {pagination.slice.map((m) => {
            const url = `${API_BASE}/admin/media/${m.id}`;
            return (
              <div key={m.id} className="group rounded-xl border border-border bg-card overflow-hidden" data-testid={`media-item-${m.id}`}>
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative">
                  <img src={url} alt={m.filename} className="h-full w-full object-cover" loading="lazy" />
                  <button onClick={() => del(m.id)} className="absolute top-2 right-2 rounded-full bg-black/60 text-white p-1 opacity-0 group-hover:opacity-100 transition" aria-label="Delete">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-3 text-xs">
                  <div className="font-medium truncate" title={m.filename}>{m.filename}</div>
                  <div className="text-muted-foreground font-mono-data mt-0.5">{fmtSize(m.size)} · {m.content_type?.replace("image/", "")}</div>
                  <div className="mt-2 flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 flex-1 gap-1 text-xs" onClick={() => copy(url)} data-testid={`media-copy-${m.id}`}>
                      <Copy className="h-3 w-3" /> Copy URL
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => del(m.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
          <AdminPagination {...pagination} onPageChange={pagination.setPage} />
        </div>
      )}
    </div>
  );
}
