import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency, ORDER_STATUS_STEPS } from "@/lib/constants";
import OrderTimeline from "@/components/OrderTimeline";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminOrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState<ApiRow | null>(null);
  const [printers, setPrinters] = useState<ApiRow[]>([]);
  const [newStatus, setNewStatus] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState("normal");
  const [printerId, setPrinterId] = useState("");

  const load = () => api.get(`/orders/${id}`).then((r) => {
    setO(r.data); setPriority(r.data.priority); setPrinterId(r.data.printer_id || "");
  });
  useEffect(() => {
    load();
    api.get("/printers").then((r) => setPrinters(r.data));
  }, [id]);

  const updateStatus = async () => {
    if (!newStatus) return;
    try {
      await api.patch(`/admin/orders/${id}/status`, { status: newStatus, note });
      toast.success("Status updated");
      setNewStatus(""); setNote("");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const updateMeta = async () => {
    try {
      await api.patch(`/admin/orders/${id}`, { priority, printer_id: printerId || null });
      toast.success("Order updated");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const deleteOrder = async () => {
    if (!window.confirm(`Permanently delete order ${o?.order_no}? This removes it from analytics.`)) return;
    try {
      await api.delete(`/admin/orders/${id}`);
      toast.success("Order deleted");
      window.location.href = "/admin/orders";
    } catch (e) { toast.error(apiError(e)); }
  };

  if (!o) return <div className="p-8"><div className="h-96 rounded-2xl shimmer" /></div>;

  return (
    <div className="p-6 lg:p-8">
      <Link to="/admin/orders" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground"><ArrowLeft className="h-3 w-3" /> All orders</Link>
      <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight font-mono-data">{o.order_no}</h1>
          <div className="text-sm text-muted-foreground">{o.user_email} · {o.created_at?.slice(0, 16).replace("T", " ")}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={o.status} />
          <Button variant="destructive" size="sm" onClick={deleteOrder} className="gap-1">
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="font-display font-semibold mb-4">Line items</div>
            <div className="space-y-3">
              {o.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
                    {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{it.name}</div>
                    <div className="text-xs text-muted-foreground">× {it.quantity}{it.variant ? ` · ${it.variant}` : ""}</div>
                  </div>
                  <div className="font-mono-data font-semibold">{formatCurrency(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6">
            <div className="font-display font-semibold mb-4">Timeline</div>
            <OrderTimeline status={o.status} timeline={o.timeline} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="font-display font-semibold mb-3">Advance status</div>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger data-testid="admin-status-select"><SelectValue placeholder="Select next status…" /></SelectTrigger>
              <SelectContent>
                {ORDER_STATUS_STEPS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                <SelectItem value="cancelled">Cancel order</SelectItem>
              </SelectContent>
            </Select>
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <Button onClick={updateStatus} disabled={!newStatus} className="mt-3 w-full bg-orange-600 hover:bg-orange-700" data-testid="admin-update-status-btn">Update</Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 space-y-3">
            <div className="font-display font-semibold">Metadata</div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Assigned printer</label>
              <Select value={printerId} onValueChange={setPrinterId}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {printers.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} · {p.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={updateMeta} variant="outline" className="w-full">Save metadata</Button>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 text-sm">
            <div className="font-display font-semibold mb-3">Summary</div>
            <div className="space-y-1">
              <Row k="Subtotal" v={formatCurrency(o.subtotal)} />
              {o.discount > 0 && <Row k={`Coupon ${o.coupon_code || ""}`} v={`− ${formatCurrency(o.discount)}`} />}
              <Row k="GST" v={formatCurrency(o.gst)} />
              <Row k="Shipping" v={o.shipping ? formatCurrency(o.shipping) : "Free"} />
              <div className="mt-2 border-t border-border pt-2 flex items-center justify-between font-semibold"><span>Total</span><span className="font-mono-data">{formatCurrency(o.total)}</span></div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 text-sm">
            <div className="font-display font-semibold mb-3">Ship to</div>
            <div>{o.address.full_name}</div>
            <div className="text-muted-foreground">{o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ""}</div>
            <div className="text-muted-foreground">{o.address.city}, {o.address.state} {o.address.postal_code}</div>
            <div className="text-muted-foreground font-mono-data mt-1">{o.address.phone}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }) { return <div className="flex items-center justify-between"><span className="text-muted-foreground">{k}</span><span className="font-mono-data">{v}</span></div>; }
