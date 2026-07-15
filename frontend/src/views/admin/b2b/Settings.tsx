import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function B2bSettings() {
  const [f, setF] = useState<ApiRow>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/b2b/settings").then((r) => setF(r.data || {})).catch((e) => toast.error(apiError(e)));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.patch("/admin/b2b/settings", {
        company_name: f.company_name,
        tagline: f.tagline,
        whatsapp_number: f.whatsapp_number,
        sales_email: f.sales_email,
        sales_phone: f.sales_phone,
        catalog_cover_title: f.catalog_cover_title,
        default_pdf_template: f.default_pdf_template,
        show_dealer_price_public: !!f.show_dealer_price_public,
        hero_image: f.hero_image,
      });
      toast.success("B2B settings saved");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  if (!f.id && !f.company_name) {
    return <div className="p-8"><div className="h-64 rounded-xl shimmer" /></div>;
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">B2B Settings</h1>
        <div className="text-sm text-muted-foreground">Portal branding and sales contact details</div>
      </header>

      <form onSubmit={save} className="max-w-xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Field label="Company name" value={f.company_name} onChange={(v) => setF({ ...f, company_name: v })} />
          <Field label="Tagline" value={f.tagline} onChange={(v) => setF({ ...f, tagline: v })} />
          <Field label="Hero image URL" value={f.hero_image} onChange={(v) => setF({ ...f, hero_image: v })} />
          <Field label="Catalog cover title" value={f.catalog_cover_title} onChange={(v) => setF({ ...f, catalog_cover_title: v })} />
        </section>

        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Field label="WhatsApp number" value={f.whatsapp_number} onChange={(v) => setF({ ...f, whatsapp_number: v })} />
          <Field label="Sales email" value={f.sales_email} onChange={(v) => setF({ ...f, sales_email: v })} />
          <Field label="Sales phone" value={f.sales_phone} onChange={(v) => setF({ ...f, sales_phone: v })} />
        </section>

        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Default PDF template</Label>
            <Select value={f.default_pdf_template || "modern"} onValueChange={(v) => setF({ ...f, default_pdf_template: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["modern", "luxury", "corporate", "minimal", "dark"].map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Show dealer price on public catalog</Label>
            <Switch checked={!!f.show_dealer_price_public} onCheckedChange={(v) => setF({ ...f, show_dealer_price_public: v })} />
          </div>
        </section>

        <Button type="submit" disabled={busy} className="bg-orange-600 hover:bg-orange-700">
          {busy ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string | number | null | undefined; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
    </div>
  );
}
