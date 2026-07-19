import React, { useState } from "react";
import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BRAND_EMAIL_HELLO, BRAND_PHONE } from "@/lib/brand";

export default function Contact() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/contact", f);
      toast.success("Message received. We'll reply within a day.");
      setF({ name: "", email: "", subject: "", message: "" });
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-14">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-orange-600 font-semibold">Contact</div>
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-bold tracking-tight">Say hello.</h1>
        <p className="mt-4 text-muted-foreground leading-relaxed max-w-md">
          Whether you have a custom print, a bulk enquiry, or you just want to nerd out about slicer settings — we'd love to hear from you.
        </p>
        <div className="mt-10 space-y-6">
          <ContactItem icon={Mail} label="Email" value={BRAND_EMAIL_HELLO} />
          <ContactItem icon={Phone} label="Phone / WhatsApp" value={BRAND_PHONE} />
          <ContactItem icon={MapPin} label="Studio" value="Koramangala, Bengaluru" />
        </div>
      </div>
      <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-8 space-y-4" data-testid="contact-form">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required data-testid="contact-name" />
          <Field label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} required data-testid="contact-email" />
        </div>
        <Field label="Subject" value={f.subject} onChange={(v) => setF({ ...f, subject: v })} required data-testid="contact-subject" />
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Message</label>
          <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required rows={5} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="contact-message" />
        </div>
        <Button type="submit" disabled={busy} className="w-full rounded-full bg-zinc-950 dark:bg-white dark:text-zinc-950" data-testid="contact-submit">
          {busy ? "Sending…" : "Send message"}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...rest} />
    </div>
  );
}

function ContactItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
