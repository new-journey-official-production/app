import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Plus, Trash2, TrendingDown, TrendingUp, Wallet, Landmark } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import AdminPagination from "@/components/admin/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type TabKey = "overview" | "expenses" | "income" | "bills" | "payments";

const TABS: { key: TabKey; label: string; path: string; kind?: string }[] = [
  { key: "overview", label: "Overview", path: "/admin/accounts" },
  { key: "expenses", label: "Expenses", path: "/admin/accounts/expenses", kind: "expense" },
  { key: "income", label: "Income", path: "/admin/accounts/income", kind: "income" },
  { key: "bills", label: "Bills to pay", path: "/admin/accounts/bills", kind: "bill" },
  { key: "payments", label: "Order payments", path: "/admin/accounts/payments" },
];

const EMPTY_FORM = { title: "", amount: "", category: "", notes: "", due_date: "" };

export default function AdminAccounts() {
  const location = useLocation();
  const tab = useMemo(() => {
    const match = TABS.find((t) => t.path === location.pathname);
    return match?.key ?? "overview";
  }, [location.pathname]);

  const [overview, setOverview] = useState<ApiRow | null>(null);
  const [entries, setEntries] = useState<ApiRow[]>([]);
  const [payments, setPayments] = useState<ApiRow[]>([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeTab = TABS.find((t) => t.key === tab)!;
  const entryPagination = usePagination(entries, 25, `${tab}-${entries.length}`);
  const payPagination = usePagination(payments, 25, payments.length);

  const loadOverview = () => api.get("/admin/accounts/overview").then((r) => setOverview(r.data)).catch(() => {});
  const loadEntries = (kind?: string) => {
    if (!kind) return;
    api.get("/admin/accounts/entries", { params: { kind } }).then((r) => setEntries(r.data)).catch(() => setEntries([]));
  };
  const loadPayments = () => api.get("/admin/billing", { params: { limit: 500 } }).then((r) => setPayments(r.data)).catch(() => setPayments([]));

  useEffect(() => {
    loadOverview();
    if (tab === "payments") loadPayments();
    else if (activeTab.kind) loadEntries(activeTab.kind);
    else setEntries([]);
  }, [tab]);

  const addEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTab.kind) return;
    setBusy(true);
    try {
      await api.post("/admin/accounts/entries", {
        kind: activeTab.kind,
        title: form.title,
        amount: Number(form.amount),
        category: form.category,
        notes: form.notes,
        due_date: form.due_date || undefined,
        status: activeTab.kind === "income" ? "received" : activeTab.kind === "bill" ? "pending" : "paid",
      });
      toast.success("Entry added");
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      loadEntries(activeTab.kind);
      loadOverview();
    } catch (err) { toast.error(apiError(err)); }
    finally { setBusy(false); }
  };

  const deleteEntry = async (id: string) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/admin/accounts/entries/${id}`);
      toast.success("Deleted");
      if (activeTab.kind) loadEntries(activeTab.kind);
      loadOverview();
    } catch (err) { toast.error(apiError(err)); }
  };

  const markBillPaid = async (id: string) => {
    try {
      await api.patch(`/admin/accounts/entries/${id}`, { status: "paid", paid_at: new Date().toISOString().slice(0, 10) });
      toast.success("Marked as paid");
      loadEntries("bill");
      loadOverview();
    } catch (err) { toast.error(apiError(err)); }
  };

  const ledger = (overview?.ledger || {}) as ApiRow;

  return (
    <div className="p-6 lg:p-8" data-testid="admin-accounts">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground">Track expenses, income, bills, and order payments</p>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <Link
            key={t.key}
            to={t.path}
            end={t.key === "overview"}
            className={`rounded-full px-4 py-1.5 text-sm border transition-colors ${
              tab === t.key ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 border-transparent" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={TrendingUp} label="Total income" value={formatCurrency(Number(ledger.total_income || 0))} />
          <StatCard icon={TrendingDown} label="Total expenses" value={formatCurrency(Number(ledger.total_expenses || 0))} />
          <StatCard icon={Landmark} label="Net profit" value={formatCurrency(Number(ledger.net_profit || 0))} />
          <StatCard icon={Wallet} label="Available funds" value={formatCurrency(Number(ledger.available_funds || 0))} />
          <StatCard icon={Wallet} label="Pending bills" value={formatCurrency(Number(ledger.pending_bills || 0))} />
          <StatCard icon={TrendingUp} label="Order revenue" value={formatCurrency(Number(overview?.order_revenue || 0))} />
          <StatCard icon={Wallet} label="Pending COD / payments" value={String(overview?.pending_order_payments ?? 0)} sub={formatCurrency(Number(overview?.pending_order_payment_total || 0))} />
        </div>
      )}

      {tab !== "overview" && tab !== "payments" && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setShowForm((v) => !v)} className="gap-2 bg-orange-600 hover:bg-orange-700">
            <Plus className="h-4 w-4" /> {showForm ? "Cancel" : `Add ${activeTab.label.toLowerCase()}`}
          </Button>
        </div>
      )}

      {showForm && activeTab.kind && (
        <form onSubmit={addEntry} className="mb-6 rounded-xl border border-border bg-card p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
          <Field label="Amount" type="number" value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required />
          <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          {activeTab.kind === "bill" && <Field label="Due date" type="date" value={form.due_date} onChange={(v) => setForm({ ...form, due_date: v })} />}
          <div className="sm:col-span-2">
            <Field label="Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Save entry"}</Button>
          </div>
        </form>
      )}

      {tab === "payments" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payPagination.slice.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono-data">{p.order_no}</TableCell>
                  <TableCell className="text-sm">{p.user_email}</TableCell>
                  <TableCell className="uppercase text-xs">{p.method}</TableCell>
                  <TableCell className="font-mono-data">{formatCurrency(p.amount)}</TableCell>
                  <TableCell>{p.status}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{p.created_at?.slice(0, 10)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination {...payPagination} onPageChange={payPagination.setPage} />
        </div>
      ) : tab !== "overview" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entryPagination.slice.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.category || "—"}</TableCell>
                  <TableCell className="font-mono-data">{formatCurrency(row.amount)}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{row.created_at?.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    {row.kind === "bill" && row.status === "pending" && (
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => markBillPaid(String(row.id))}>Mark paid</Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteEntry(String(row.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <AdminPagination {...entryPagination} onPageChange={entryPagination.setPage} />
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 font-mono-data text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
    </div>
  );
}
