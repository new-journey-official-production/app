import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await register(f);
      toast.success("Account created");
      const from = loc.state?.from;
      nav(from || "/account");
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-tight text-center">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">Join {BRAND_NAME} and start ordering thoughtful prints.</p>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-8 space-y-4" data-testid="register-form">
          <Field label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} required data-testid="register-name" />
          <Field label="Email" type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} required data-testid="register-email" />
          <Field label="Phone (optional)" value={f.phone} onChange={(v) => setF({ ...f, phone: v })} data-testid="register-phone" />
          <Field label="Password" type="password" value={f.password} onChange={(v) => setF({ ...f, password: v })} required data-testid="register-password" />
          <Button type="submit" disabled={busy} className="w-full rounded-full bg-orange-600 hover:bg-orange-700" data-testid="register-submit">
            {busy ? "Creating…" : "Create account"}
          </Button>
          <div className="text-center text-sm">
            Already have an account? <Link to="/login" state={loc.state} className="font-semibold hover:text-orange-600" data-testid="register-login-link">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, ...rest }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40" {...rest} />
    </div>
  );
}
