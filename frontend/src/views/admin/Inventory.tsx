import React, { useEffect, useState } from "react";
import { Plus, Trash2, AlertTriangle, Edit } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency, MATERIALS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const empty = { name: "", kind: "filament", material: "PLA", color: "", quantity: 0, unit: "kg", reorder_level: 0, unit_cost: 0, supplier: "" };

export default function AdminInventory() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState(empty);
  const load = () => api.get("/inventory").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      await api.post("/inventory", { ...f, quantity: Number(f.quantity), reorder_level: Number(f.reorder_level), unit_cost: Number(f.unit_cost) });
      toast.success("Item added");
      setOpen(false); setF(empty); load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const openEdit = (item: ApiRow) => {
    setEditId(String(item.id));
    setF({
      name: item.name || "",
      kind: item.kind || "filament",
      material: item.material || "PLA",
      color: item.color || "",
      quantity: item.quantity ?? 0,
      unit: item.unit || "kg",
      reorder_level: item.reorder_level ?? 0,
      unit_cost: item.unit_cost ?? 0,
      supplier: item.supplier || "",
    });
    setEditOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editId) return;
    try {
      await api.patch(`/inventory/${editId}`, {
        ...f,
        quantity: Number(f.quantity),
        reorder_level: Number(f.reorder_level),
        unit_cost: Number(f.unit_cost),
      });
      toast.success("Item updated");
      setEditOpen(false); setEditId(null); setF(empty); load();
    } catch (err) { toast.error(apiError(err)); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    await api.delete(`/inventory/${id}`);
    load();
  };

  const filaments = items.filter((i) => i.kind === "filament");
  const other = items.filter((i) => i.kind !== "filament");
  const lowStock = items.filter((i) => i.quantity <= i.reorder_level);

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Inventory</h1>
          <div className="text-sm text-muted-foreground">{items.length} items · {lowStock.length} low stock</div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2 bg-orange-600 hover:bg-orange-700" data-testid="new-inventory-btn"><Plus className="h-4 w-4" /> Add item</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New inventory item</DialogTitle></DialogHeader>
            <InventoryForm f={f} setF={setF} onSubmit={save} submitLabel="Save" />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit inventory item</DialogTitle></DialogHeader>
          <InventoryForm f={f} setF={setF} onSubmit={saveEdit} submitLabel="Update" />
        </DialogContent>
      </Dialog>

      {lowStock.length > 0 && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4 mb-6 flex items-center gap-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <div><span className="font-semibold text-red-600">{lowStock.length} items</span> at or below reorder level — {lowStock.map((i) => i.name).join(", ")}</div>
        </div>
      )}

      <div className="grid gap-6">
        <InvSection title="Filaments" items={filaments} onEdit={openEdit} onDel={del} />
        <InvSection title="Other supplies" items={other} onEdit={openEdit} onDel={del} />
      </div>
    </div>
  );
}

function InvSection({ title, items, onEdit, onDel }) {
  return (
    <section>
      <div className="font-display font-semibold mb-3">{title}</div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Material</TableHead><TableHead>Color</TableHead><TableHead>Quantity</TableHead><TableHead>Reorder</TableHead><TableHead>Unit cost</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.name}</TableCell>
                <TableCell className="text-sm">{i.material || "—"}</TableCell>
                <TableCell className="text-sm">{i.color || "—"}</TableCell>
                <TableCell><span className={`font-mono-data ${i.quantity <= i.reorder_level ? "text-red-600 font-bold" : ""}`}>{i.quantity} {i.unit}</span></TableCell>
                <TableCell className="font-mono-data text-muted-foreground">{i.reorder_level} {i.unit}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(i.unit_cost)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(i)} title="Edit"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => onDel(i.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function InventoryForm({ f, setF, onSubmit, submitLabel }) {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
      <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required className="col-span-2" />
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Kind</label>
        <Select value={f.kind} onValueChange={(v) => setF({ ...f, kind: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="filament">Filament</SelectItem>
            <SelectItem value="packaging">Packaging</SelectItem>
            <SelectItem value="tool">Tool</SelectItem>
            <SelectItem value="consumable">Consumable</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {f.kind === "filament" && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Material</label>
          <Select value={f.material} onValueChange={(v) => setF({ ...f, material: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      <Field label="Color" value={f.color} onChange={(v) => setF({ ...f, color: v })} />
      <Field label="Quantity" type="number" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} required />
      <Field label="Unit" value={f.unit} onChange={(v) => setF({ ...f, unit: v })} />
      <Field label="Reorder level" type="number" value={f.reorder_level} onChange={(v) => setF({ ...f, reorder_level: v })} />
      <Field label="Unit cost (₹)" type="number" value={f.unit_cost} onChange={(v) => setF({ ...f, unit_cost: v })} />
      <Field label="Supplier" value={f.supplier} onChange={(v) => setF({ ...f, supplier: v })} className="col-span-2" />
      <Button type="submit" className="col-span-2">{submitLabel}</Button>
    </form>
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
