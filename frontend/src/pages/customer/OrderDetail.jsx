import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import CustomerShell from "./CustomerShell";
import OrderTimeline from "@/components/OrderTimeline";
import StatusBadge from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/constants";

export default function CustomerOrderDetail() {
  const { id } = useParams();
  const [o, setO] = useState(null);
  useEffect(() => { api.get(`/orders/${id}`).then((r) => setO(r.data)).catch(() => {}); }, [id]);
  if (!o) return <CustomerShell><div className="h-96 rounded-2xl shimmer" /></CustomerShell>;

  return (
    <CustomerShell>
      <Link to="/account/orders" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4"><ArrowLeft className="h-3 w-3" /> All orders</Link>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{o.order_no}</h1>
          <div className="text-xs text-muted-foreground mt-1">Placed {o.created_at?.slice(0, 16).replace("T", " ")}</div>
        </div>
        <StatusBadge status={o.status} />
      </div>

      <div className="mt-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border p-6">
            <div className="font-display font-semibold text-lg mb-4">Items</div>
            <div className="space-y-3" data-testid="order-items">
              {o.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
                    {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${it.slug}`} className="font-medium hover:text-orange-600">{it.name}</Link>
                    <div className="text-xs text-muted-foreground">Qty {it.quantity}{it.variant ? ` · ${it.variant}` : ""}</div>
                  </div>
                  <div className="font-mono-data font-semibold">{formatCurrency(it.price * it.quantity)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border p-6">
            <div className="font-display font-semibold text-lg mb-4">Timeline</div>
            <OrderTimeline status={o.status} timeline={o.timeline} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border p-6">
            <div className="font-display font-semibold text-lg mb-4">Summary</div>
            <div className="space-y-2 text-sm">
              <Row k="Subtotal" v={formatCurrency(o.subtotal)} />
              {o.discount > 0 && <Row k={`Coupon ${o.coupon_code || ""}`} v={`− ${formatCurrency(o.discount)}`} />}
              <Row k="GST" v={formatCurrency(o.gst)} />
              <Row k="Shipping" v={o.shipping === 0 ? "Free" : formatCurrency(o.shipping)} />
              <div className="border-t border-border pt-2 mt-2 flex items-center justify-between font-semibold"><span>Total</span><span className="font-mono-data">{formatCurrency(o.total)}</span></div>
              <div className="text-xs text-muted-foreground mt-2">Payment: {o.payment_method?.toUpperCase()}</div>
            </div>
          </section>
          <section className="rounded-2xl border border-border p-6 text-sm">
            <div className="font-display font-semibold text-lg mb-3">Shipping</div>
            <div>{o.address.full_name}</div>
            <div className="text-muted-foreground">{o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ""}</div>
            <div className="text-muted-foreground">{o.address.city}, {o.address.state} {o.address.postal_code}</div>
            <div className="text-muted-foreground font-mono-data mt-1">{o.address.phone}</div>
          </section>
        </aside>
      </div>
    </CustomerShell>
  );
}

function Row({ k, v }) { return <div className="flex items-center justify-between"><span className="text-muted-foreground">{k}</span><span className="font-mono-data">{v}</span></div>; }
