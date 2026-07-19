import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BRAND_STUDIO } from "@/lib/brand";

export default function AdminSettings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [storefront, setStorefront] = useState<ApiRow>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    api.get("/admin/storefront/settings").then((r) => setStorefront(r.data || {})).catch(() => {});
  }, []);

  const uploadHero = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", files[0]);
      const { data } = await api.post("/admin/media/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data?.id) {
        const url = `${API_BASE}/admin/media/${data.id}`;
        setStorefront((s) => ({ ...s, hero_image: url }));
        toast.success("Hero image uploaded — click Save storefront");
      }
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveStorefront = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch("/admin/storefront/settings", {
        hero_image: storefront.hero_image || "",
        hero_title: storefront.hero_title || "",
        hero_subtitle: storefront.hero_subtitle || "",
      });
      setStorefront(data);
      toast.success("Storefront settings saved");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>

      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="font-display font-semibold">Shop homepage hero</div>
        <p className="text-sm text-muted-foreground">Upload a hero banner for the main shop landing page (like B2B).</p>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadHero(e.target.files)} />
        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-2">
          <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload hero image"}
        </Button>
        {storefront.hero_image && (
          <div className="rounded-lg overflow-hidden border max-h-48">
            <img src={storefront.hero_image} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <Field label="Hero headline (optional)" value={storefront.hero_title || ""} onChange={(v) => setStorefront({ ...storefront, hero_title: v })} />
        <div>
          <Label className="text-xs text-muted-foreground">Hero subtitle (optional)</Label>
          <textarea rows={2} value={storefront.hero_subtitle || ""} onChange={(e) => setStorefront({ ...storefront, hero_subtitle: e.target.value })} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <Button onClick={saveStorefront} disabled={busy || uploading} className="bg-orange-600 hover:bg-orange-700">
          {busy ? "Saving…" : "Save storefront"}
        </Button>
      </section>

      <section className="rounded-xl border border-border bg-card p-6">
        <div className="font-display font-semibold mb-4">Studio profile</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-xs text-muted-foreground uppercase tracking-widest">Studio name</div><div className="mt-1 font-medium">{BRAND_STUDIO}</div></div>
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
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
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
