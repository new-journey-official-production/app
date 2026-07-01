import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-display font-semibold mb-4">Studio profile</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-muted-foreground uppercase tracking-widest">Studio name</div><div className="mt-1 font-medium">PrintForge Studio</div></div>
          <div><div className="text-xs text-muted-foreground uppercase tracking-widest">Signed in as</div><div className="mt-1 font-medium">{user?.email}</div></div>
          <div><div className="text-xs text-muted-foreground uppercase tracking-widest">Role</div><div className="mt-1 font-medium capitalize">{user?.role}</div></div>
          <div><div className="text-xs text-muted-foreground uppercase tracking-widest">API</div><div className="mt-1 font-mono-data text-xs">/api · v1.0.0</div></div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-display font-semibold mb-4">Appearance</div>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm">Dark mode</div>
            <div className="text-xs text-muted-foreground">Toggle the studio's operating theme</div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-display font-semibold mb-4">Integrations</div>
        <div className="space-y-3 text-sm">
          <IntegrationRow name="Email delivery" status="Mocked" hint="Ready to swap in Resend or SendGrid — hooks emit today." />
          <IntegrationRow name="Payment gateway" status="Mocked" hint="Order/payment flow works. Swap `PaymentService.charge()` for Stripe/Razorpay." />
          <IntegrationRow name="WhatsApp notifications" status="Hook ready" hint="Every order status transition already emits — plug Twilio when ready." />
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-display font-semibold mb-4">Danger zone</div>
        <Button variant="destructive" disabled>Wipe demo data (disabled)</Button>
      </section>
    </div>
  );
}

function IntegrationRow({ name, status, hint }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold">{status}</span>
    </div>
  );
}
