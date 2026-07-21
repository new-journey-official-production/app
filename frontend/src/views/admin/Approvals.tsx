import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, XCircle, IndianRupee, Clock3, BadgeCheck, Ban } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { paymentStatusLabel, REJECTION_REASONS } from "@/lib/upi";
import AdminPaginatedPanel from "@/components/admin/AdminPaginatedPanel";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function mediaSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = API_BASE.replace(/\/api$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}

export default function AdminApprovals() {
  const [summary, setSummary] = useState<ApiRow | null>(null);
  const [rows, setRows] = useState<ApiRow[]>([]);
  const [filter, setFilter] = useState("verification_pending");
  const [view, setView] = useState<ApiRow | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState(REJECTION_REASONS[0]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [s, list] = await Promise.all([
        api.get("/admin/approvals/summary"),
        api.get("/admin/approvals", { params: { status: filter === "all" ? undefined : filter, limit: 500 } }),
      ]);
      setSummary(s.data);
      setRows(list.data);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const pagination = usePagination(rows, 25, `${filter}-${rows.length}`);

  const approve = async (paymentId: string) => {
    if (!window.confirm("Confirm payment approval?")) return;
    setBusy(true);
    try {
      await api.post(`/admin/approvals/${paymentId}/approve`);
      toast.success("Payment approved — order moved to production");
      setView(null);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectId) return;
    setBusy(true);
    try {
      await api.post(`/admin/approvals/${rejectId}/reject`, { reason });
      toast.success("Payment rejected");
      setRejectId(null);
      setView(null);
      load();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setBusy(false);
    }
  };

  const openView = async (row: ApiRow) => {
    try {
      const { data } = await api.get(`/admin/approvals/${row.id}`);
      setView({ ...row, detail: data });
    } catch {
      setView(row);
    }
  };

  const cards = useMemo(
    () => [
      { label: "Pending Payment Approvals", value: summary?.pending_count ?? 0, icon: Clock3 },
      { label: "Approved Today", value: summary?.approved_today ?? 0, icon: BadgeCheck },
      { label: "Rejected Today", value: summary?.rejected_today ?? 0, icon: Ban },
      { label: "Pending Revenue", value: formatCurrency(Number(summary?.pending_revenue || 0)), icon: IndianRupee },
      { label: "Approved Revenue", value: formatCurrency(Number(summary?.approved_revenue || 0)), icon: CheckCircle2 },
    ],
    [summary],
  );

  return (
    <div className="p-6 lg:p-8" data-testid="admin-approvals">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-sm text-muted-foreground">Verify customer UPI payment proofs before production starts.</p>
      </header>

      <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <div className="mt-2 font-mono-data text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { id: "verification_pending", label: "Verification pending" },
          { id: "approved", label: "Approved" },
          { id: "rejected", label: "Rejected" },
          { id: "all", label: "All" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setFilter(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${
              filter === t.id
                ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-transparent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AdminPaginatedPanel pagination={pagination}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>UPI Txn ID</TableHead>
              <TableHead>Screenshot</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.slice.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                  No approvals in this queue.
                </TableCell>
              </TableRow>
            ) : (
              pagination.slice.map((row) => (
                <TableRow key={String(row.id)}>
                  <TableCell className="font-mono-data">
                    <Link to={`/admin/orders/${row.order_id}`} className="hover:text-orange-600">
                      {row.order_no}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{row.customer_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">{row.user_email}</div>
                  </TableCell>
                  <TableCell className="font-mono-data">{formatCurrency(row.amount)}</TableCell>
                  <TableCell className="uppercase text-xs">{row.method}</TableCell>
                  <TableCell className="font-mono-data text-xs">{row.upi_transaction_id || "—"}</TableCell>
                  <TableCell>
                    {row.screenshot_url ? (
                      <img src={mediaSrc(String(row.screenshot_url))} alt="Proof" className="h-10 w-10 rounded object-cover border" />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(row.submitted_at || row.created_at || "").toString().slice(0, 16).replace("T", " ")}
                  </TableCell>
                  <TableCell className="text-xs">{paymentStatusLabel(String(row.status))}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="sm" variant="outline" className="gap-1" onClick={() => openView(row)}>
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                    {row.status === "verification_pending" && (
                      <>
                        <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={() => approve(String(row.id))}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" disabled={busy} onClick={() => setRejectId(String(row.id))}>
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminPaginatedPanel>

      {view && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setView(null)}>
          <div className="w-full max-w-2xl rounded-2xl bg-background border border-border p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display text-xl font-bold">{view.order_no}</h2>
                <p className="text-sm text-muted-foreground">{view.customer_name} · {view.user_email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setView(null)}>
                Close
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <div className="text-muted-foreground text-xs">Amount</div>
                <div className="font-mono-data font-semibold text-lg">{formatCurrency(view.amount)}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">UPI Transaction ID</div>
                <div className="font-mono-data">{view.upi_transaction_id || "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Status</div>
                <div>{paymentStatusLabel(String(view.status))}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Note</div>
                <div>{view.payment_note || "—"}</div>
              </div>
            </div>
            {view.screenshot_url && (
              <a href={mediaSrc(String(view.screenshot_url))} target="_blank" rel="noreferrer">
                <img src={mediaSrc(String(view.screenshot_url))} alt="Payment proof" className="w-full rounded-xl border object-contain max-h-96 bg-zinc-50 dark:bg-zinc-900" />
              </a>
            )}
            {view.status === "verification_pending" && (
              <div className="mt-5 flex gap-2 justify-end">
                <Button variant="destructive" disabled={busy} onClick={() => setRejectId(String(view.id))}>
                  Reject
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={() => approve(String(view.id))}>
                  Approve payment
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background border border-border p-6">
            <h3 className="font-display text-lg font-bold mb-2">Reject payment</h3>
            <p className="text-sm text-muted-foreground mb-4">Select a reason. The customer will see payment failed.</p>
            <select value={reason} onChange={(e) => setReason(e.target.value as typeof reason)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-4">
              {REJECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectId(null)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={busy} onClick={reject}>
                Confirm reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
