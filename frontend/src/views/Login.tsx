import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await login(email, password);
      toast.success("Welcome back");
      const from = loc.state?.from;
      nav(from || (u.role === "admin" || u.role === "staff" ? "/admin" : "/account"));
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to track orders, save designs, and check out faster.</p>
        </div>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-8 space-y-4" data-testid="login-form">
          <Field label="Email" type="email" value={email} onChange={setEmail} required data-testid="login-email" />
          <Field label="Password" type="password" value={password} onChange={setPassword} required data-testid="login-password" />
          <Button type="submit" disabled={busy} className="w-full rounded-full bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950" data-testid="login-submit">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <div className="text-xs text-center text-muted-foreground">
            <Link to="/forgot-password" className="hover:text-foreground" data-testid="login-forgot-link">Forgot password?</Link>
          </div>
          <div className="text-center text-sm">
            No account? <Link to="/register" state={loc.state} className="font-semibold hover:text-orange-600" data-testid="login-register-link">Create one</Link>
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
