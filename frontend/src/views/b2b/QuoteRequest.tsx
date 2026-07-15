import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { trackB2b } from "@/views/b2b/shared";

const empty = {
  business_name: "",
  owner_name: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
  product_id: "",
  product_name: "",
  quantity: 1,
  customization: "",
  message: "",
};

export default function B2bQuoteRequest() {
  const [params] = useSearchParams();
  const [f, setF] = useState<ApiRow>({ ...empty });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const productSlug = params.get("product");
    if (!productSlug) return;
    api.get(`/b2b/products/${productSlug}`)
      .then((r) => {
        const p = r.data.product;
        setF((prev) => ({
          ...prev,
          product_id: p.id,
          product_name: p.name,
          quantity: p.min_order_qty ?? p.recommended_moq ?? 1,
        }));
      })
      .catch(() => {});
  }, [params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/b2b/quotes", {
        business_name: f.business_name,
        owner_name: f.owner_name,
        phone: f.phone,
        email: f.email,
        gst: f.gst || "",
        address: f.address || "",
        product_id: f.product_id || null,
        product_name: f.product_name || "",
        quantity: Number(f.quantity) || 1,
        customization: f.customization || "",
        message: f.message || "",
      });
      trackB2b("quote", { product_id: f.product_id || undefined });
      setDone(true);
      toast.success("Quote request submitted");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="rounded-2xl border border-border bg-card p-10">
          <div className="text-4xl mb-4">✓</div>
          <h1 className="font-display text-2xl font-bold">Quote request received</h1>
          <p className="text-muted-foreground mt-3">Our sales team will contact you within 1–2 business days.</p>
          <Link to="/b2b/catalog" className="inline-block mt-6"><Button variant="outline">Back to catalog</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/b2b" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4">
        <ArrowLeft className="h-3 w-3" /> B2B home
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight">Request a quote</h1>
      <p className="text-muted-foreground mt-2">Tell us about your business and order requirements.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-muted-foreground">Business details</h2>
          <Field label="Business name" value={f.business_name} onChange={(v) => setF({ ...f, business_name: v })} required />
          <Field label="Owner / contact name" value={f.owner_name} onChange={(v) => setF({ ...f, owner_name: v })} required />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Phone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} required />
            <Field label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} required />
          </div>
          <Field label="GST (optional)" value={f.gst} onChange={(v) => setF({ ...f, gst: v })} />
          <div>
            <Label className="text-xs text-muted-foreground">Address</Label>
            <textarea rows={2} value={f.address || ""} onChange={(e) => setF({ ...f, address: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-display font-semibold text-sm uppercase tracking-widest text-muted-foreground">Order details</h2>
          <Field label="Product name" value={f.product_name} onChange={(v) => setF({ ...f, product_name: v })} placeholder="Product you're interested in" />
          <Field label="Quantity" type="number" value={f.quantity} onChange={(v) => setF({ ...f, quantity: v })} required />
          <Field label="Customization needs" value={f.customization} onChange={(v) => setF({ ...f, customization: v })} placeholder="Logo, colors, packaging…" />
          <div>
            <Label className="text-xs text-muted-foreground">Additional message</Label>
            <textarea rows={4} value={f.message || ""} onChange={(e) => setF({ ...f, message: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>
        </section>

        <Button type="submit" disabled={busy} className="w-full bg-orange-600 hover:bg-orange-700">
          {busy ? "Submitting…" : "Submit quote request"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder }: { label: string; value: string | number | null | undefined; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}{required ? " *" : ""}</Label>
      <input type={type} value={value ?? ""} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
    </div>
  );
}
