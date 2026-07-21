import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loader2, ShieldCheck, Upload, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { buildUpiPayUrl, generateUpiQrDataUrl, paymentStatusLabel } from "@/lib/upi";
import { Button } from "@/components/ui/button";

function resolveMediaUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE.replace(/\/api$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function PaymentPage() {
  const { orderId } = useParams();
  const nav = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(true);
  const [order, setOrder] = useState<ApiRow | null>(null);
  const [payment, setPayment] = useState<ApiRow | null>(null);
  const [config, setConfig] = useState<ApiRow | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [upiTxnId, setUpiTxnId] = useState("");
  const [note, setNote] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/payments/order/${orderId}`);
      setOrder(data.order);
      setPayment(data.payment || data.order?.payment || null);
      setConfig(data.config);
    } catch (err) {
      toast.error(apiError(err));
      nav("/account/orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [orderId]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!order || !config) return;
      setQrLoading(true);
      try {
        await new Promise((r) => setTimeout(r, 700));
        if (config.qr_type === "static" && config.static_qr_url) {
          if (!cancelled) setQrUrl(resolveMediaUrl(String(config.static_qr_url)));
          return;
        }
        const payload =
          (payment?.qr_payload as string) ||
          buildUpiPayUrl({
            upiId: String(config.upi_id || ""),
            merchantName: String(config.merchant_name || "New Journey"),
            amount: Number(order.total || 0),
            orderNo: String(order.order_no || order.id),
          });
        const dataUrl = await generateUpiQrDataUrl(payload);
        if (!cancelled) setQrUrl(dataUrl);
      } catch {
        if (!cancelled) toast.error("Could not generate payment QR");
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [order, config, payment?.qr_payload]);

  const status = String(payment?.status || "pending");
  const submitted = status === "verification_pending" || status === "approved" || status === "paid";
  const rejected = status === "rejected";

  const instructions = useMemo(() => {
    const raw = String(config?.instructions || "");
    return raw
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
  }, [config]);

  const uploadProof = async (file?: File | null) => {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Only PNG, JPG, or WEBP images are allowed");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Screenshot must be under 3 MB");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/payments/proof-upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setScreenshotUrl(data.url || `/api/payments/media/${data.id}`);
      toast.success("Screenshot uploaded");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const submitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    if (!screenshotUrl) return toast.error("Upload a payment screenshot");
    if (!upiTxnId.trim()) return toast.error("UPI Transaction ID is required");
    setSubmitting(true);
    try {
      const { data } = await api.post(`/payments/order/${orderId}/proof`, {
        upi_transaction_id: upiTxnId.trim(),
        screenshot_url: screenshotUrl,
        payment_note: note || undefined,
      });
      setPayment(data);
      toast.success("Payment proof submitted");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !order) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-50 via-zinc-50 to-zinc-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-black">
      <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-orange-700 dark:text-orange-400 mb-3">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Complete Your Payment</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Order <span className="font-mono-data text-foreground">{order.order_no}</span> ·{" "}
            <span className="font-mono-data text-foreground">{formatCurrency(order.total)}</span>
          </p>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.4 }}
          className="mt-6 rounded-3xl border border-border/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur p-5 shadow-sm"
        >
          <div className="font-display font-semibold mb-3">Product summary</div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(order.items || []).map((it: ApiRow, i: number) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0 truncate">
                  {it.name} <span className="text-muted-foreground">× {it.quantity}</span>
                </div>
                <div className="font-mono-data flex-none">{formatCurrency(Number(it.price) * Number(it.quantity))}</div>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.4 }}
          className="mt-4 rounded-3xl border border-border/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-5 shadow-sm"
        >
          <div className="inline-flex items-center rounded-full border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 text-xs font-medium text-orange-800 dark:text-orange-300 mb-4">
            Pay with UPI
          </div>

          <div className="rounded-2xl border border-dashed border-border bg-zinc-50 dark:bg-zinc-950 p-6 flex flex-col items-center">
            {qrLoading ? (
              <div className="py-16 flex flex-col items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                Generating secure payment QR…
              </div>
            ) : (
              <motion.img
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={qrUrl}
                alt="UPI QR Code"
                className="h-64 w-64 rounded-xl bg-white p-2 shadow-sm"
              />
            )}
            <div className="mt-4 text-center">
              <div className="text-xs text-muted-foreground">Amount</div>
              <div className="font-mono-data text-2xl font-bold">{formatCurrency(order.total)}</div>
              <div className="text-xs text-muted-foreground mt-1">UPI Payment · Supported by all UPI apps</div>
              {config?.upi_id && <div className="mt-2 font-mono-data text-xs text-foreground/80">{String(config.upi_id)}</div>}
            </div>
          </div>

          <ol className="mt-5 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            {(instructions.length
              ? instructions
              : ["Scan QR code", "Complete payment", "Upload payment proof", "Wait for confirmation"]
            ).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </motion.section>

        {submitted ? (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/80 dark:bg-emerald-950/30 p-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                  {status === "approved" || status === "paid" ? "Payment approved" : "Verification Pending"}
                </div>
                <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80 mt-1">
                  {status === "approved" || status === "paid"
                    ? "Your payment has been verified. Your order is moving to production."
                    : "Your payment proof has been submitted. Our team will verify and confirm your order."}
                </p>
                <div className="text-xs mt-2 font-mono-data">Status: {paymentStatusLabel(status)}</div>
                <Button asChild className="mt-4 rounded-full" variant="outline">
                  <Link to={`/account/orders/${order.id}`}>Track order</Link>
                </Button>
              </div>
            </div>
          </motion.section>
        ) : rejected ? (
          <section className="mt-4 rounded-3xl border border-red-200 dark:border-red-900 bg-red-50/80 dark:bg-red-950/30 p-5">
            <div className="font-semibold text-red-700 dark:text-red-300">Payment Failed</div>
            <p className="text-sm mt-1 text-red-800/80 dark:text-red-200/80">
              {payment?.rejection_reason || "Your payment could not be verified."} Please place a new order if you still wish to purchase.
            </p>
            <Button asChild className="mt-4 rounded-full bg-orange-600 hover:bg-orange-700">
              <Link to="/products">Browse products</Link>
            </Button>
          </section>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            onSubmit={submitProof}
            className="mt-4 rounded-3xl border border-border/80 bg-white/90 dark:bg-zinc-900/90 backdrop-blur p-5 shadow-sm space-y-4"
          >
            <div className="font-display font-semibold text-lg">Submit Payment Details</div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Payment Screenshot</label>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={(e) => uploadProof(e.target.files?.[0])}
              />
              <Button type="button" variant="outline" className="gap-2 w-full" disabled={uploading} onClick={() => fileRef.current?.click()}>
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : screenshotUrl ? "Replace screenshot" : "Upload screenshot"}
              </Button>
              {screenshotUrl && (
                <img src={resolveMediaUrl(screenshotUrl)} alt="Payment screenshot" className="mt-3 h-36 w-full object-contain rounded-xl border bg-zinc-50 dark:bg-zinc-950" />
              )}
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">UPI Transaction ID *</label>
              <input
                required
                value={upiTxnId}
                onChange={(e) => setUpiTxnId(e.target.value)}
                placeholder="e.g. 123456789012"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono-data"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">Payment Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full rounded-full bg-orange-600 hover:bg-orange-700 h-11">
              {submitting ? "Submitting…" : "Submit Payment"}
            </Button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
