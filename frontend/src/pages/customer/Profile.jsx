import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import CustomerShell from "./CustomerShell";
import { api, apiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function CustomerProfile() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: "", phone: "", avatar_url: "" });
  const [addresses, setAddresses] = useState([]);
  const [addr, setAddr] = useState({ label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "India", is_default: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) setF({ name: user.name || "", phone: user.phone || "", avatar_url: user.avatar_url || "" });
    api.get("/addresses").then((r) => setAddresses(r.data));
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.patch("/auth/profile", f);
      setUser(data);
      toast.success("Profile updated");
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  const addAddr = async (e) => {
    e.preventDefault();
    try {
      await api.post("/addresses", addr);
      const r = await api.get("/addresses");
      setAddresses(r.data);
      setAddr({ label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "India", is_default: false });
      toast.success("Address saved");
    } catch (err) { toast.error(apiError(err)); }
  };

  const removeAddr = async (id) => {
    await api.delete(`/addresses/${id}`);
    setAddresses((a) => a.filter((x) => x.id !== id));
  };

  return (
    <CustomerShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Profile</h1>

      <form onSubmit={save} className="mt-6 rounded-2xl border border-border p-6 space-y-4 max-w-xl" data-testid="profile-form">
        <div className="font-display font-semibold text-lg">Account</div>
        <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <Field label="Phone" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
        <div className="text-xs text-muted-foreground">Email: <span className="font-mono-data">{user?.email}</span> (cannot be changed)</div>
        <Button type="submit" disabled={busy} data-testid="profile-save-btn">{busy ? "Saving…" : "Save changes"}</Button>
      </form>

      <div className="mt-10">
        <div className="font-display font-semibold text-lg">Address book</div>
        <div className="mt-4 grid md:grid-cols-2 gap-4" data-testid="address-list">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-xl border border-border p-4 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{a.full_name} <span className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">{a.label}</span></div>
                <button onClick={() => removeAddr(a.id)} className="text-xs text-red-600 hover:underline">Remove</button>
              </div>
              <div className="mt-1 text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
              <div className="text-muted-foreground">{a.city}, {a.state} {a.postal_code}</div>
            </div>
          ))}
        </div>
        <form onSubmit={addAddr} className="mt-4 rounded-2xl border border-dashed border-border p-6 grid grid-cols-2 gap-3 max-w-xl">
          <div className="col-span-2 font-medium">Add new address</div>
          <Field label="Full name" value={addr.full_name} onChange={(v) => setAddr({ ...addr, full_name: v })} required />
          <Field label="Phone" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} required />
          <Field label="Line 1" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} required className="col-span-2" />
          <Field label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} required />
          <Field label="State" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} required />
          <Field label="Postal code" value={addr.postal_code} onChange={(v) => setAddr({ ...addr, postal_code: v })} required />
          <Field label="Country" value={addr.country} onChange={(v) => setAddr({ ...addr, country: v })} />
          <Button type="submit" className="col-span-2">Save address</Button>
        </form>
      </div>
    </CustomerShell>
  );
}

function Field({ label, value, onChange, className = "", ...rest }) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...rest} />
    </div>
  );
}
