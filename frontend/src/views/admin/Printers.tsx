import React, { useEffect, useState } from "react";
import { Plus, Trash2, Printer as PrinterIcon, Edit } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import AdminPaginatedPanel from "@/components/admin/AdminPaginatedPanel";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS = {
  idle: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  printing: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  paused: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  offline: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300",
};

const empty = { name: "", model: "", status: "idle", nozzle_size: "0.4mm", filament_loaded: "", current_job: "", total_hours: 0 };

export default function AdminPrinters() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(empty);

  const load = () => api.get("/printers").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/printers", { ...f, total_hours: Number(f.total_hours) });
      toast.success("Printer added"); setOpen(false); setF(empty); load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const openEdit = (p: ApiRow) => {
    setEditId(String(p.id));
    setF({
      name: p.name || "",
      model: p.model || "",
      status: p.status || "idle",
      nozzle_size: p.nozzle_size || "0.4mm",
      filament_loaded: p.filament_loaded || "",
      current_job: p.current_job || "",
      total_hours: p.total_hours ?? 0,
    });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await api.patch(`/printers/${editId}`, { ...f, total_hours: Number(f.total_hours) });
      toast.success("Printer updated"); setEditOpen(false); setEditId(null); setF(empty); load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const setStatus = async (id, status) => {
    await api.patch(`/printers/${id}`, { status });
    load();
  };

  const del = async (id) => { if (window.confirm("Delete printer?")) { await api.delete(`/printers/${id}`); load(); } };

  const pagination = usePagination(items, 25, items.length);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Printers</h1>
          <div className="text-sm text-muted-foreground">{items.length} machines in studio</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2 bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4" /> Add printer</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New printer</DialogTitle></DialogHeader>
            <PrinterForm f={f} setF={setF} onSubmit={save} submitLabel="Save" />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit printer</DialogTitle></DialogHeader>
          <PrinterForm f={f} setF={setF} onSubmit={saveEdit} submitLabel="Update" />
        </DialogContent>
      </Dialog>

      <AdminPaginatedPanel pagination={pagination}>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 p-4" data-testid="printer-grid">
        {pagination.slice.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <PrinterIcon className="h-4 w-4 text-orange-600" />
                  <div className="font-display font-semibold">{p.name}</div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{p.model}</div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold ${STATUS_COLORS[p.status]}`}>{p.status}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Meta k="Nozzle" v={p.nozzle_size} />
              <Meta k="Hours" v={`${p.total_hours}h`} />
              <div className="col-span-2"><Meta k="Filament" v={p.filament_loaded || "—"} /></div>
              {p.current_job && <div className="col-span-2"><Meta k="Job" v={p.current_job} /></div>}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Select value={p.status} onValueChange={(v) => setStatus(p.id, v)}>
                <SelectTrigger className="text-xs h-8 flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idle">Idle</SelectItem>
                  <SelectItem value="printing">Printing</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} title="Edit"><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        </div>
      </AdminPaginatedPanel>
    </div>
  );
}

function PrinterForm({ f, setF, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
      <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required className="col-span-2" />
      <Field label="Model" value={f.model} onChange={(v) => setF({ ...f, model: v })} required className="col-span-2" />
      <Field label="Nozzle size" value={f.nozzle_size} onChange={(v) => setF({ ...f, nozzle_size: v })} />
      <Field label="Total hours" type="number" value={f.total_hours} onChange={(v) => setF({ ...f, total_hours: v })} />
      <Field label="Filament loaded" value={f.filament_loaded} onChange={(v) => setF({ ...f, filament_loaded: v })} className="col-span-2" />
      <Field label="Current job" value={f.current_job} onChange={(v) => setF({ ...f, current_job: v })} className="col-span-2" />
      <div className="col-span-2">
        <label className="text-xs text-muted-foreground block mb-1">Status</label>
        <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="idle">Idle</SelectItem>
            <SelectItem value="printing">Printing</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="col-span-2">{submitLabel}</Button>
    </form>
  );
}

function Meta({ k, v }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{k}</div>
      <div className="font-mono-data">{v}</div>
    </div>
  );
}

function Field({ label, value, onChange, className = "", ...rest }) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...rest} />
    </div>
  );
}
