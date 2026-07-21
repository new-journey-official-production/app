import React, { useEffect, useState } from "react";
import { Bell, Mail, Smartphone, Pencil } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type FormState = {
  event_name: string;
  description: string;
  enabled: boolean;
  channel_email: boolean;
  channel_in_app: boolean;
  channel_sms: boolean;
  title_template: string;
  body_template: string;
  display_order: number;
};

export default function AdminNotificationConfiguration() {
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get("/admin/notification-configurations")
      .then((r) => setRows(r.data))
      .catch((err) => toast.error(apiError(err)));

  useEffect(() => {
    load();
  }, []);

  const openEdit = (row: ApiRow) => {
    setEditId(String(row.id));
    setForm({
      event_name: String(row.event_name || ""),
      description: String(row.description || ""),
      enabled: Boolean(row.enabled),
      channel_email: Boolean(row.channel_email),
      channel_in_app: Boolean(row.channel_in_app),
      channel_sms: Boolean(row.channel_sms),
      title_template: String(row.title_template || ""),
      body_template: String(row.body_template || ""),
      display_order: Number(row.display_order || 0),
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !form) return;
    setBusy(true);
    try {
      await api.put(`/admin/notification-configurations/${editId}`, form);
      toast.success("Notification rule saved");
      setEditId(null);
      setForm(null);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async (row: ApiRow) => {
    try {
      await api.put(`/admin/notification-configurations/${row.id}`, {
        event_name: row.event_name,
        description: row.description || "",
        enabled: !row.enabled,
        channel_email: row.channel_email,
        channel_in_app: row.channel_in_app,
        channel_sms: row.channel_sms,
        title_template: row.title_template,
        body_template: row.body_template,
        display_order: row.display_order || 0,
      });
      load();
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <div className="p-6 lg:p-8" data-testid="admin-notification-configuration">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Masters</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Notification Configuration</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Choose when customers get notified. Uses their email and phone from the account profile.
          SMS is prepared for delivery (logged until an SMS provider is connected).
        </p>
        <p className="text-xs text-muted-foreground mt-2 font-mono-data">
          Template variables: {"{{name}}"} {"{{email}}"} {"{{phone}}"} {"{{order_no}}"} {"{{total}}"} {"{{status}}"}
        </p>
      </header>

      {form && (
        <form onSubmit={save} className="mb-8 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display font-semibold">{form.event_name}</div>
              <div className="text-xs text-muted-foreground">Edit channels and message templates</div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.enabled} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
              <span className="text-sm">{form.enabled ? "Enabled" : "Disabled"}</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <ChannelToggle
              icon={Mail}
              label="Email"
              hint="Customer account email"
              checked={form.channel_email}
              onChange={(v) => setForm({ ...form, channel_email: v })}
            />
            <ChannelToggle
              icon={Bell}
              label="In-app"
              hint="Account notifications"
              checked={form.channel_in_app}
              onChange={(v) => setForm({ ...form, channel_in_app: v })}
            />
            <ChannelToggle
              icon={Smartphone}
              label="SMS / Phone"
              hint="Uses customer phone number"
              checked={form.channel_sms}
              onChange={(v) => setForm({ ...form, channel_sms: v })}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Title template</label>
            <input
              required
              value={form.title_template}
              onChange={(e) => setForm({ ...form, title_template: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Body template</label>
            <textarea
              required
              rows={4}
              value={form.body_template}
              onChange={(e) => setForm({ ...form, body_template: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => { setEditId(null); setForm(null); }}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="bg-orange-600 hover:bg-orange-700">
              {busy ? "Saving…" : "Save rule"}
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Channels</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Template preview</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                  No notification rules yet. Restart the API to apply the migration seed.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell>
                    <div className="font-medium">{row.event_name}</div>
                    <div className="text-xs text-muted-foreground font-mono-data">{row.event_key}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{row.description}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {row.channel_email && <Chip icon={Mail} label="Email" />}
                      {row.channel_in_app && <Chip icon={Bell} label="In-app" />}
                      {row.channel_sms && <Chip icon={Smartphone} label="SMS" />}
                      {!row.channel_email && !row.channel_in_app && !row.channel_sms && (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={Boolean(row.enabled)} onCheckedChange={() => toggleEnabled(row)} />
                      <span className="text-xs">{row.enabled ? "On" : "Off"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate" title={String(row.body_template)}>
                    {row.title_template}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
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

function ChannelToggle({
  icon: Icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`rounded-xl border p-3 cursor-pointer flex items-start gap-3 ${checked ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : "border-border"}`}>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5" />
      <div>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>
      </div>
    </label>
  );
}

function Chip({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}
