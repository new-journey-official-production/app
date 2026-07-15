import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const empty = {
  company_name: "",
  owner_name: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
  business_type: "",
  categories: [] as string[],
  monthly_purchase_volume: "",
};

const BUSINESS_TYPES = ["Retailer", "Distributor", "Corporate", "E-commerce", "Other"];
const VOLUMES = ["Under ₹50K", "₹50K – ₹2L", "₹2L – ₹10L", "₹10L+"];

export default function B2bDealerApply() {
  const [f, setF] = useState<ApiRow>({ ...empty, categories: [] });
  const [catInput, setCatInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const addCategory = () => {
    if (!catInput.trim()) return;
    setF({ ...f, categories: [...(f.categories as string[]), catInput.trim()] });
    setCatInput("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/b2b/dealers", {
        company_name: f.company_name,
        owner_name: f.owner_name,
        phone: f.phone,
        email: f.email,
        gst: f.gst || "",
        address: f.address || "",
        business_type: f.business_type || "",
        categories: f.categories || [],
        monthly_purchase_volume: f.monthly_purchase_volume || "",
      });
      setDone(true);
      toast.success("Application submitted");
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
          <h1 className="font-display text-2xl font-bold">Application received</h1>
          <p className="text-muted-foreground mt-3">We'll review your dealer application and get back to you shortly.</p>
          <Link to="/b2b" className="inline-block mt-6"><Button variant="outline">Back to B2B</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/b2b" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4">
        <ArrowLeft className="h-3 w-3" /> B2B home
      </Link>
      <h1 className="font-display text-3xl font-bold tracking-tight">Become a dealer</h1>
      <p className="text-muted-foreground mt-2">Join our authorized dealer network for wholesale pricing and dedicated support.</p>

      <form onSubmit={submit} className="mt-8 space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Field label="Company name" value={f.company_name} onChange={(v) => setF({ ...f, company_name: v })} required />
          <Field label="Owner / contact name" value={f.owner_name} onChange={(v) => setF({ ...f, owner_name: v })} required />
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Phone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} required />
            <Field label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} required />
          </div>
          <Field label="GST number" value={f.gst} onChange={(v) => setF({ ...f, gst: v })} />
          <div>
            <Label className="text-xs text-muted-foreground">Business address</Label>
            <textarea rows={2} value={f.address || ""} onChange={(e) => setF({ ...f, address: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Business type</Label>
            <select value={f.business_type || ""} onChange={(e) => setF({ ...f, business_type: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
              <option value="">Select</option>
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Monthly purchase volume</Label>
            <select value={f.monthly_purchase_volume || ""} onChange={(e) => setF({ ...f, monthly_purchase_volume: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1">
              <option value="">Select</option>
              {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Product categories of interest</Label>
            <div className="flex gap-2 mb-2">
              <input value={catInput} onChange={(e) => setCatInput(e.target.value)} placeholder="e.g. Corporate gifts" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={addCategory}><Plus className="h-4 w-4" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(f.categories as string[]).map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                  {c}
                  <button type="button" onClick={() => setF({ ...f, categories: (f.categories as string[]).filter((_, j) => j !== i) })}><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          </div>
        </section>

        <Button type="submit" disabled={busy} className="w-full bg-orange-600 hover:bg-orange-700">
          {busy ? "Submitting…" : "Submit application"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string | number | null | undefined; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}{required ? " *" : ""}</Label>
      <input type={type} value={value ?? ""} required={required} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
    </div>
  );
}
