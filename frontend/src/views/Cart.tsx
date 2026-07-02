import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Minus, Plus, Trash2, ShoppingBag, TicketPercent } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { api, apiError } from "@/lib/api";

export default function Cart() {
  const { items, remove, update, totals } = useCart();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [applied, setApplied] = useState("");
  const [busy, setBusy] = useState(false);

  const applyCoupon = async () => {
    if (!coupon) return;
    setBusy(true);
    try {
      const { data } = await api.get("/coupons/validate", { params: { code: coupon.toUpperCase(), subtotal: totals.subtotal } });
      setDiscount(data.discount);
      setApplied(data.coupon.code);
      toast.success(`${data.coupon.code} applied — you saved ${formatCurrency(data.discount)}`);
    } catch (e) { toast.error(apiError(e)); }
    finally { setBusy(false); }
  };

  const grand = Math.max(0, totals.subtotal - discount) * 1.18 + (totals.subtotal >= 999 || totals.subtotal === 0 ? 0 : 79);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center" data-testid="empty-cart">
        <ShoppingBag className="h-14 w-14 mx-auto text-muted-foreground/50" />
        <h1 className="font-display text-3xl font-bold mt-6">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Add a few thoughtful prints and treat yourself.</p>
        <Link to="/products" className="mt-6 inline-block"><Button className="rounded-full">Browse the catalog</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Your cart</h1>
      <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-10">
        <div className="space-y-4" data-testid="cart-items">
          {items.map((it) => (
            <div key={`${it.product_id}-${it.variant}`} className="flex gap-4 rounded-2xl border border-border p-4" data-testid={`cart-item-${it.slug}`}>
              <Link to={`/product/${it.slug}`} className="h-24 w-24 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
                {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${it.slug}`} className="font-display font-semibold text-lg hover:text-orange-600">{it.name}</Link>
                <div className="text-xs text-muted-foreground mt-0.5">{it.material}{it.variant ? ` · ${it.variant}` : ""}</div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button onClick={() => update(it.product_id, it.quantity - 1, it.variant)} className="px-2 py-1"><Minus className="h-3 w-3" /></button>
                    <div className="w-8 text-center font-mono-data text-sm">{it.quantity}</div>
                    <button onClick={() => update(it.product_id, it.quantity + 1, it.variant)} className="px-2 py-1"><Plus className="h-3 w-3" /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-mono-data font-semibold">{formatCurrency(it.price * it.quantity)}</div>
                    <button onClick={() => remove(it.product_id, it.variant)} className="text-muted-foreground hover:text-red-600" data-testid={`cart-remove-${it.slug}`}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="rounded-2xl border border-border p-6 h-fit sticky top-24" data-testid="cart-summary">
          <div className="font-display font-semibold text-lg">Order summary</div>
          <div className="mt-4 space-y-2 text-sm">
            <Row k="Subtotal" v={formatCurrency(totals.subtotal)} />
            {discount > 0 && <Row k={`Coupon (${applied})`} v={`− ${formatCurrency(discount)}`} className="text-emerald-600" />}
            <Row k="GST (18%)" v={formatCurrency(Math.max(0, totals.subtotal - discount) * 0.18)} />
            <Row k="Shipping" v={totals.subtotal >= 999 ? "Free" : formatCurrency(79)} />
            <div className="border-t border-border pt-3 mt-3 flex items-center justify-between font-semibold">
              <span>Total</span>
              <span className="font-mono-data text-lg" data-testid="cart-total">{formatCurrency(grand)}</span>
            </div>
          </div>
          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-foreground/70 mb-2 font-semibold flex items-center gap-1"><TicketPercent className="h-3.5 w-3.5" />Coupon</div>
            <div className="flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="WELCOME10" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="coupon-input" />
              <Button onClick={applyCoupon} disabled={busy} variant="outline" data-testid="coupon-apply-btn">{busy ? "…" : "Apply"}</Button>
            </div>
          </div>
          <Link to="/checkout" className="block mt-5">
            <Button className="w-full rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950" data-testid="checkout-btn">Proceed to checkout</Button>
          </Link>
          <Link to="/products" className="mt-3 block text-center text-xs text-muted-foreground hover:text-foreground">Continue shopping →</Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v, className = "" }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono-data">{v}</span>
    </div>
  );
}
