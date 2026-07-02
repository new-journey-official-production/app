import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold tracking-tight text-center">Forgot your password?</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">We'll email you a link to reset it.</p>
        {sent ? (
          <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-sm">
            If that email exists, a reset link has been sent. (In demo mode the link is logged to the backend console.)
            <Link to="/login" className="mt-4 block"><Button variant="outline" className="mt-4">Back to sign in</Button></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 rounded-2xl border border-border bg-card p-8 space-y-4">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" data-testid="forgot-email" />
            <Button type="submit" disabled={busy} className="w-full rounded-full" data-testid="forgot-submit">{busy ? "Sending…" : "Send reset link"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
