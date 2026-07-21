import React, { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormState = {
  payment_method_name: string;
  payment_method_type: string;
  status: string;
  merchant_name: string;
  business_name: string;
  upi_id: string;
  qr_type: string;
  static_qr_url: string;
  instructions: string;
  min_amount: string;
  max_amount: string;
  display_order: string;
};

const EMPTY: FormState = {
  payment_method_name: "UPI Payment",
  payment_method_type: "upi",
  status: "active",
  merchant_name: "New Journey",
  business_name: "New Journey 3D Printing",
  upi_id: "",
  qr_type: "dynamic",
  static_qr_url: "",
  instructions:
    "Scan QR using any UPI application.\nComplete payment.\nUpload payment screenshot.\nYour order will be verified shortly.",
  min_amount: "",
  max_amount: "",
  display_order: "1",
};

export default function AdminPaymentConfiguration() {
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    api
      .get("/admin/payment-configurations")
      .then((r) => setRows(r.data))
      .catch((err) => toast.error(apiError(err)));

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditId(null);
    setForm({ ...EMPTY });
    setShowForm(true);
  };

  const openEdit = (row: ApiRow) => {
    setEditId(String(row.id));
    setForm({
      payment_method_name: String(row.payment_method_name || ""),
      payment_method_type: String(row.payment_method_type || "upi"),
      status: String(row.status || "active"),
      merchant_name: String(row.merchant_name || ""),
      business_name: String(row.business_name || ""),
      upi_id: String(row.upi_id || ""),
      qr_type: String(row.qr_type || "dynamic"),
      static_qr_url: String(row.static_qr_url || ""),
      instructions: String(row.instructions || ""),
      min_amount: row.min_amount != null ? String(row.min_amount) : "",
      max_amount: row.max_amount != null ? String(row.max_amount) : "",
      display_order: String(row.display_order ?? 1),
    });
    setShowForm(true);
  };

  const uploadStaticQr = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((f) => ({ ...f, static_qr_url: data.url || `${API_BASE}/admin/media/${data.id}` }));
      toast.success("Static QR uploaded");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      payment_method_name: form.payment_method_name,
      payment_method_type: form.payment_method_type,
      status: form.status,
      merchant_name: form.merchant_name,
      business_name: form.business_name,
      upi_id: form.upi_id,
      qr_type: form.qr_type,
      static_qr_url: form.static_qr_url,
      instructions: form.instructions,
      min_amount: form.min_amount === "" ? null : Number(form.min_amount),
      max_amount: form.max_amount === "" ? null : Number(form.max_amount),
      display_order: Number(form.display_order || 0),
    };
    try {
      if (editId) await api.put(`/admin/payment-configurations/${editId}`, payload);
      else await api.post("/admin/payment-configurations", payload);
      toast.success(editId ? "Configuration updated" : "Configuration created");
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this payment configuration?")) return;
    try {
      await api.delete(`/admin/payment-configurations/${id}`);
      toast.success("Deleted");
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const toggleStatus = async (row: ApiRow) => {
    const next = row.status === "active" ? "inactive" : "active";
    try {
      await api.put(`/admin/payment-configurations/${row.id}`, {
        payment_method_name: row.payment_method_name,
        payment_method_type: row.payment_method_type,
        status: next,
        merchant_name: row.merchant_name,
        business_name: row.business_name,
        upi_id: row.upi_id,
        qr_type: row.qr_type,
        static_qr_url: row.static_qr_url || "",
        instructions: row.instructions || "",
        min_amount: row.min_amount ?? null,
        max_amount: row.max_amount ?? null,
        display_order: row.display_order ?? 0,
      });
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="p-6 lg:p-8" data-testid="admin-payment-configuration">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Masters</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Payment Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage UPI VPA, QR generation, and payment instructions from one place.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" /> Add method
        </Button>
      </header>

      {showForm && (
        <form onSubmit={save} className="mb-8 rounded-xl border border-border bg-card p-5 grid sm:grid-cols-2 gap-4">
          <Field label="Payment Method Name" value={form.payment_method_name} onChange={(v) => setForm({ ...form, payment_method_name: v })} required />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Payment Method Type</label>
            <select
              value={form.payment_method_type}
              onChange={(e) => setForm({ ...form, payment_method_type: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="upi">UPI</option>
              <option value="gateway" disabled>
                Gateway (soon)
              </option>
              <option value="cod" disabled>
                COD (soon)
              </option>
            </select>
          </div>
          <Field label="Merchant Name" value={form.merchant_name} onChange={(v) => setForm({ ...form, merchant_name: v })} required />
          <Field label="Business Name" value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} />
          <Field label="UPI ID / VPA" value={form.upi_id} onChange={(v) => setForm({ ...form, upi_id: v })} required />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">QR Generation Type</label>
            <select
              value={form.qr_type}
              onChange={(e) => setForm({ ...form, qr_type: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="dynamic">Dynamic QR (default)</option>
              <option value="static">Static QR (backup)</option>
            </select>
          </div>
          <Field label="Minimum Payment Amount" type="number" value={form.min_amount} onChange={(v) => setForm({ ...form, min_amount: v })} />
          <Field label="Maximum Payment Amount" type="number" value={form.max_amount} onChange={(v) => setForm({ ...form, max_amount: v })} />
          <Field label="Display Order" type="number" value={form.display_order} onChange={(v) => setForm({ ...form, display_order: v })} />
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.status === "active"} onCheckedChange={(v) => setForm({ ...form, status: v ? "active" : "inactive" })} />
            <span className="text-sm">{form.status === "active" ? "Active" : "Inactive"}</span>
          </div>

          {form.qr_type === "static" && (
            <div className="sm:col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Static QR Upload (PNG / JPG / WEBP)</label>
              <div className="flex flex-wrap items-center gap-3">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => uploadStaticQr(e.target.files?.[0])} />
                <Button type="button" variant="outline" className="gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
                  <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload QR"}
                </Button>
                {form.static_qr_url && (
                  <img
                    src={form.static_qr_url.startsWith("http") ? form.static_qr_url : `${API_BASE.replace(/\/api$/, "")}${form.static_qr_url}`}
                    alt="Static QR"
                    className="h-20 w-20 rounded-md border object-cover"
                  />
                )}
              </div>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="text-xs text-muted-foreground block mb-1">Payment Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="bg-orange-600 hover:bg-orange-700">
              {busy ? "Saving…" : "Save configuration"}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>UPI ID</TableHead>
              <TableHead>QR</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                  No payment configurations yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell>
                    <div className="font-medium">{row.payment_method_name}</div>
                    <div className="text-xs text-muted-foreground">{row.business_name || row.merchant_name}</div>
                  </TableCell>
                  <TableCell className="uppercase text-xs">{row.payment_method_type}</TableCell>
                  <TableCell className="font-mono-data text-sm">{row.upi_id || "—"}</TableCell>
                  <TableCell className="capitalize text-sm">{row.qr_type}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={row.status === "active"} onCheckedChange={() => toggleStatus(row)} />
                      <span className="text-xs capitalize">{row.status}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono-data">{row.display_order}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(String(row.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
    </div>
  );
}
