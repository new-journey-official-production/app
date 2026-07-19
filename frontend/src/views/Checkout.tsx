import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard, Wallet, Building2, Truck, Plus, Loader2, Smartphone } from "lucide-react";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/constants";
import { BRAND_UPI_ID } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const EMPTY_FORM = {
  full_name: "", phone: "", line1: "", line2: "", city: "", state: "",
  postal_code: "", country: "India", label: "Home", is_default: true,
};

/** Online UPI app options shown at checkout. */
const ONLINE_METHODS = [
  { id: "gpay", label: "Google Pay", icon: Smartphone },
  { id: "phonepe", label: "PhonePe", icon: Smartphone },
  { id: "paytm", label: "Paytm", icon: Smartphone },
  { id: "upi", label: "Other UPI", icon: Wallet },
] as const;

const ONLINE_IDS = new Set(ONLINE_METHODS.map((m) => m.id));

function isOnlineMethod(method: string) {
  return ONLINE_IDS.has(method as typeof ONLINE_METHODS[number]["id"]);
}

/** Normalizes address rows from API (snake_case keys). */
function normalizeAddresses(raw: unknown): ApiRow[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === "object")
    .map((a) => {
      const row = a as ApiRow;
      const id = row.id ?? (row as ApiRow & { Id?: string }).Id;
      return id ? { ...row, id: String(id) } : null;
    })
    .filter(Boolean) as ApiRow[];
}

function addressIdFromRow(row: unknown): string {
  if (!row || typeof row !== "object") return "";
  const r = row as ApiRow & { Id?: string };
  const id = r.id ?? r.Id;
  return id ? String(id) : "";
}

export default function Checkout() {
  const { items, totals, clear } = useCart();
  const nav = useNavigate();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<ApiRow[]>([]);
  const [addressId, setAddressId] = useState("");
  const [method, setMethod] = useState("cod");
  const [coupon, setCoupon] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [payModal, setPayModal] = useState<{ open: boolean; phase: "loading" | "confirm" | "processing" | "done"; orderId?: string }>({
    open: false, phase: "loading",
  });

  const pickDefaultAddress = (list: ApiRow[]) => {
    const def = list.find((a) => a.is_default) || list[0];
    if (def?.id) setAddressId(String(def.id));
  };

  useEffect(() => {
    if (items.length === 0) nav("/cart");
  }, [items.length, nav]);

  useEffect(() => {
    if (!user) return;
    api.get("/addresses")
      .then((r) => {
        const list = normalizeAddresses(r.data);
        setAddresses(list);
        if (list.length > 0) {
          pickDefaultAddress(list);
          setShowForm(false);
        } else {
          setShowForm(true);
        }
      })
      .catch((err) => {
        setAddresses([]);
        setShowForm(true);
        toast.error(apiError(err));
      });
  }, [user]);

  const saveAddress = async (e) => {
    e.preventDefault();
    setAddrSaving(true);
    try {
      const { data: created } = await api.post("/addresses", form);
      const savedId = addressIdFromRow(created);
      if (savedId) {
        setAddressId(savedId);
        setShowForm(false);
        setForm({ ...EMPTY_FORM });
      }
      try {
        const { data: refreshed } = await api.get("/addresses");
        const list = normalizeAddresses(refreshed);
        setAddresses(list);
        if (list.length > 0) pickDefaultAddress(list);
        else if (savedId) setAddressId(savedId);
        setShowForm(false);
      } catch {
        if (savedId) setAddresses((prev) => prev.length ? prev : [{ ...form, id: savedId, is_default: form.is_default }]);
      }
      toast.success("Address saved");
    } catch (err) { toast.error(apiError(err)); }
    finally { setAddrSaving(false); }
  };

  /** Submits order to API and returns created order id. */
  const submitOrder = async () => {
    const payload = {
      items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, variant: i.variant })),
      address_id: addressId,
      payment_method: method,
      coupon_code: coupon || undefined,
      notes: notes || undefined,
    };
    const { data } = await api.post("/orders", payload);
    return String(data.id);
  };

  const finishOrder = (orderId: string) => {
    clear();
    setPayModal({ open: true, phase: "done", orderId });
    setTimeout(() => {
      nav(`/account/orders/${orderId}`);
    }, 1800);
  };

  const placeOrder = async () => {
    if (!addressId) return toast.error("Add a shipping address");
    setBusy(true);

    if (isOnlineMethod(method)) {
      setPayModal({ open: true, phase: "loading" });
      try {
        // Brief loading screen before showing UPI payment details.
        await new Promise((r) => setTimeout(r, 1200));
        setPayModal({ open: true, phase: "confirm" });
      } finally {
        setBusy(false);
      }
      return;
    }

    try {
      const orderId = await submitOrder();
      toast.success("Order placed!");
      nav(`/account/orders/${orderId}`);
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  /** User confirms UPI payment — place order after simulated processing. */
  const confirmUpiPayment = async () => {
    setPayModal((m) => ({ ...m, phase: "processing" }));
    try {
      await new Promise((r) => setTimeout(r, 2500));
      const orderId = await submitOrder();
      finishOrder(orderId);
    } catch (err) {
      setPayModal({ open: false, phase: "loading" });
      toast.error(apiError(err));
    }
  };

  const selectedAddress = addresses.find((a) => String(a.id) === String(addressId));
  const canPlaceOrder = Boolean(addressId);
  const onlineLabel = ONLINE_METHODS.find((m) => m.id === method)?.label || "UPI";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Checkout</h1>
      <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-10">
        <div className="space-y-8">
          <section className="rounded-2xl border border-border p-6" data-testid="checkout-address-section">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-semibold text-lg">Shipping address</div>
              {addresses.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setShowForm((v) => !v)} className="gap-1" data-testid="add-address-btn">
                  <Plus className="h-4 w-4" /> {showForm ? "Cancel" : "New"}
                </Button>
              )}
            </div>
            {addresses.length > 0 && !showForm && (
              <RadioGroup value={addressId} onValueChange={setAddressId} className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} htmlFor={a.id} className={`flex gap-3 rounded-xl border p-4 cursor-pointer ${addressId === a.id ? "border-zinc-950 dark:border-white" : "border-border"}`} data-testid={`address-${a.id}`}>
                    <RadioGroupItem value={String(a.id)} id={String(a.id)} className="mt-1" />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold">{a.full_name} <span className="text-xs text-muted-foreground ml-2">{a.label}</span></div>
                      <div className="text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
                      <div className="text-muted-foreground">{a.city}, {a.state} {a.postal_code}, {a.country}</div>
                      <div className="text-muted-foreground font-mono-data mt-1">{a.phone}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            )}
            {showForm && (
              <form onSubmit={saveAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="address-form">
                <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
                <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
                <Field label="Address line 1" value={form.line1} onChange={(v) => setForm({ ...form, line1: v })} required className="col-span-2" />
                <Field label="Address line 2 (optional)" value={form.line2} onChange={(v) => setForm({ ...form, line2: v })} className="col-span-2" />
                <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
                <Field label="State" value={form.state} onChange={(v) => setForm({ ...form, state: v })} required />
                <Field label="Postal code" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} required />
                <Field label="Country" value={form.country} onChange={(v) => setForm({ ...form, country: v })} />
                <Button type="submit" className="col-span-2 mt-2" disabled={addrSaving} data-testid="save-address-btn">{addrSaving ? "Saving…" : "Save address"}</Button>
              </form>
            )}
            {addressId && selectedAddress && !showForm && (
              <div className="mt-3 text-xs text-emerald-600">Shipping to {selectedAddress.full_name}, {selectedAddress.city}</div>
            )}
          </section>

          <section className="rounded-2xl border border-border p-6" data-testid="checkout-payment-section">
            <div className="font-display font-semibold text-lg mb-4">Payment method</div>
            <RadioGroup value={method} onValueChange={setMethod} className="grid sm:grid-cols-2 gap-3">
              {ONLINE_METHODS.map(({ id, label, icon: Icon }) => (
                <PaymentTile key={id} id={id} label={label} icon={Icon} checked={method === id} />
              ))}
              <PaymentTile id="card" label="Credit / Debit Card" icon={CreditCard} checked={method === "card"} disabled hint="Soon" />
              <PaymentTile id="netbanking" label="Net Banking" icon={Building2} checked={method === "netbanking"} disabled hint="Soon" />
              <PaymentTile id="cod" label="Cash on Delivery" icon={Truck} checked={method === "cod"} />
            </RadioGroup>
            {isOnlineMethod(method) && (
              <div className="mt-3 text-xs text-muted-foreground rounded-md bg-muted p-3">
                Pay via {onlineLabel} to UPI ID <span className="font-mono-data font-semibold text-foreground">{BRAND_UPI_ID}</span> after placing the order.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border p-6">
            <div className="font-display font-semibold text-lg mb-3">Order notes (optional)</div>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Anything you'd like the studio to know?" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="order-notes-input" />
          </section>
        </div>

        <aside className="rounded-2xl border border-border p-6 h-fit lg:sticky lg:top-24" data-testid="checkout-summary">
          <div className="font-display font-semibold text-lg">Order summary</div>
          <div className="mt-4 space-y-2 text-sm max-h-64 overflow-y-auto">
            {items.map((it) => (
              <div key={`${it.product_id}-${it.variant}`} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
                    {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{it.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono-data">× {it.quantity}</div>
                  </div>
                </div>
                <div className="font-mono-data text-sm">{formatCurrency(it.price * it.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="my-4 border-t border-border" />
          <div className="space-y-2 text-sm">
            <Row k="Subtotal" v={formatCurrency(totals.subtotal)} />
            <Row k="GST (18%)" v="—" />
            <Row k="Shipping" v="—" />
          </div>
          <div className="mt-3 flex gap-2">
            <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xs" data-testid="checkout-coupon-input" />
          </div>
          <div className="mt-4 border-t border-border pt-3 flex items-center justify-between">
            <div className="font-semibold">Total</div>
            <div className="font-mono-data font-bold text-lg" data-testid="checkout-total">{formatCurrency(totals.total)}</div>
          </div>
          <Button onClick={placeOrder} disabled={busy || !canPlaceOrder || payModal.open} className="w-full mt-5 rounded-full bg-orange-600 hover:bg-orange-700" data-testid="place-order-btn">
            {busy ? "Placing order…" : `Place order · ${formatCurrency(totals.total)}`}
          </Button>
          <div className="mt-3 text-[11px] text-muted-foreground text-center">
            Estimated delivery: 4–7 business days
          </div>
        </aside>
      </div>

      {payModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-testid="upi-payment-modal">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl text-center">
            {payModal.phase === "loading" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-orange-600" />
                <div className="mt-4 font-display font-semibold text-lg">Preparing payment…</div>
                <p className="mt-2 text-sm text-muted-foreground">Setting up secure {onlineLabel} checkout</p>
              </>
            )}
            {payModal.phase === "confirm" && (
              <>
                <div className="font-display font-semibold text-xl">Complete payment</div>
                <p className="mt-2 text-sm text-muted-foreground">Send <span className="font-mono-data font-bold text-foreground">{formatCurrency(totals.total)}</span> via {onlineLabel}</p>
                <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">UPI ID</div>
                  <div className="mt-1 font-mono-data text-lg font-bold break-all">{BRAND_UPI_ID}</div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Open {onlineLabel}, pay the exact amount, then tap the button below.</p>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setPayModal({ open: false, phase: "loading" })}>Cancel</Button>
                  <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={confirmUpiPayment} data-testid="confirm-upi-payment-btn">I have paid</Button>
                </div>
              </>
            )}
            {payModal.phase === "processing" && (
              <>
                <Loader2 className="h-10 w-10 animate-spin mx-auto text-orange-600" />
                <div className="mt-4 font-display font-semibold text-lg">Verifying payment…</div>
                <p className="mt-2 text-sm text-muted-foreground">Please wait while we confirm your {onlineLabel} payment</p>
              </>
            )}
            {payModal.phase === "done" && (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-2xl">✓</div>
                <div className="mt-4 font-display font-semibold text-xl">Order placed!</div>
                <p className="mt-2 text-sm text-muted-foreground">Payment received. Redirecting to your order…</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, className = "", ...rest }) {
  return (
    <div className={className}>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...rest} />
    </div>
  );
}

function PaymentTile({ id, label, icon: Icon, checked, disabled = false, hint }) {
  return (
    <label htmlFor={id} className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer ${checked ? "border-zinc-950 dark:border-white bg-zinc-50 dark:bg-zinc-900" : "border-border"} ${disabled ? "opacity-55 cursor-not-allowed" : ""}`} data-testid={`pay-${id}`}>
      <RadioGroupItem value={id} id={id} disabled={disabled} />
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium flex-1">{label}</span>
      {hint && <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{hint}</span>}
    </label>
  );
}

function Row({ k, v }) {
  return <div className="flex items-center justify-between"><span className="text-muted-foreground">{k}</span><span className="font-mono-data">{v}</span></div>;
}
