import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const empty = { code: "", kind: "percent", value: 10, min_order: 0, max_discount: null, is_active: true };

export default function AdminCoupons() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);

  const load = () => api.get("/coupons").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/coupons", {
        ...f, code: f.code.toUpperCase(), value: Number(f.value),
        min_order: Number(f.min_order), max_discount: f.max_discount === "" || f.max_discount == null ? null : Number(f.max_discount),
      });
      toast.success("Coupon created"); setOpen(false); setF(empty); load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const del = async (id) => { if (window.confirm("Delete?")) { await api.delete(`/coupons/${id}`); load(); } };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Coupons</h1>
          <div className="text-sm text-muted-foreground">{items.length} active</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2 bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4" /> New coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New coupon</DialogTitle></DialogHeader>
            <form onSubmit={save} className="grid grid-cols-2 gap-3">
              <Field label="Code" value={f.code} onChange={(v) => setF({ ...f, code: v })} required className="col-span-2" />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Kind</label>
                <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Field label={f.kind === "percent" ? "Percent" : "Amount (₹)"} type="number" value={f.value} onChange={(v) => setF({ ...f, value: v })} />
              <Field label="Min order (₹)" type="number" value={f.min_order} onChange={(v) => setF({ ...f, min_order: v })} />
              <Field label="Max discount (₹, optional)" type="number" value={f.max_discount ?? ""} onChange={(v) => setF({ ...f, max_discount: v })} />
              <div className="col-span-2 flex items-center justify-between">
                <label className="text-sm">Active</label>
                <Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} />
              </div>
              <Button type="submit" className="col-span-2">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Kind</TableHead><TableHead>Value</TableHead><TableHead>Min order</TableHead><TableHead>Max</TableHead><TableHead>Active</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono-data font-semibold">{c.code}</TableCell>
                <TableCell className="text-sm capitalize">{c.kind}</TableCell>
                <TableCell className="font-mono-data">{c.kind === "percent" ? `${c.value}%` : formatCurrency(c.value)}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(c.min_order)}</TableCell>
                <TableCell className="font-mono-data">{c.max_discount ? formatCurrency(c.max_discount) : "—"}</TableCell>
                <TableCell><span className={`text-[10px] px-2 py-0.5 rounded-full ${c.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800"}`}>{c.is_active ? "Active" : "Off"}</span></TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => del(c.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
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
