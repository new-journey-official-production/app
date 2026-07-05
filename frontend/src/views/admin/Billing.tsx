import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, Receipt, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { downloadFullInvoice, downloadPackingSlip } from "@/lib/invoicePdf";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const PAYMENT_STATUSES = [
  { key: "all", label: "All statuses" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
  { key: "failed", label: "Failed" },
  { key: "refunded", label: "Refunded" },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  refunded: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

export default function AdminBilling() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const load = () => {
    const params: Record<string, string> = {};
    if (status !== "all") params.status = status;
    if (q) params.q = q;
    api.get("/admin/billing", { params }).then((r) => setItems(r.data)).catch((e) => toast.error(apiError(e)));
  };

  useEffect(() => { load(); }, [status, q]);

  const updateStatus = async (paymentId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/billing/${paymentId}/status`, { status: newStatus });
      toast.success("Payment status updated");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const fetchAndPdf = async (orderId: string, kind: "invoice" | "slip") => {
    setPdfBusy(`${kind}-${orderId}`);
    try {
      const { data } = await api.get(`/admin/billing/order/${orderId}`);
      const payload = { order: data.order as ApiRow, payment: data.payment as ApiRow | null };
      if (kind === "invoice") downloadFullInvoice(payload);
      else downloadPackingSlip(payload);
      toast.success(kind === "invoice" ? "Invoice downloaded" : "Packing slip downloaded");
    } catch (e) { toast.error(apiError(e)); }
    finally { setPdfBusy(null); }
  };

  return (
    <div className="p-6 lg:p-8" data-testid="admin-billing">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Billing</h1>
          <div className="text-sm text-muted-foreground">Track payments, update status, and generate invoices</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Order #, email, txn…"
              className="h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm w-56"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Txn ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id} data-testid={`billing-row-${row.order_no}`}>
                <TableCell>
                  <Link to={`/admin/orders/${row.order_id}`} className="font-mono-data font-semibold hover:text-orange-600">
                    {row.order_no}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{row.user_email}</TableCell>
                <TableCell className="text-xs uppercase">{row.method}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(row.amount)}</TableCell>
                <TableCell>
                  <Select value={String(row.status)} onValueChange={(v) => updateStatus(String(row.id), v)}>
                    <SelectTrigger className={`h-7 text-[10px] uppercase w-[110px] border-0 ${STATUS_COLORS[row.status] || ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUSES.filter((s) => s.key !== "all").map((s) => (
                        <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs capitalize">{String(row.order_status || "").replace(/_/g, " ")}</TableCell>
                <TableCell className="font-mono-data text-[10px] text-muted-foreground">{row.transaction_id}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Full invoice PDF"
                      disabled={pdfBusy === `invoice-${row.order_id}`}
                      onClick={() => fetchAndPdf(String(row.order_id), "invoice")}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Packing slip PDF"
                      disabled={pdfBusy === `slip-${row.order_id}`}
                      onClick={() => fetchAndPdf(String(row.order_id), "slip")}
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Link to={`/admin/orders/${row.order_id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="View order">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  No billing records yet. Payments appear here when orders are placed.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
