import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated. Please sign in.");
      nav("/login");
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-tight text-center">Set a new password</h1>
        <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-8 space-y-4">
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="reset-password" />
          <Button type="submit" disabled={busy || !token} className="w-full rounded-full">{busy ? "Updating…" : "Update password"}</Button>
          {!token && <div className="text-xs text-red-600 text-center">Missing reset token</div>}
          <div className="text-center text-sm"><Link to="/login" className="hover:text-orange-600">Back to sign in</Link></div>
        </form>
      </div>
    </div>
  );
}
