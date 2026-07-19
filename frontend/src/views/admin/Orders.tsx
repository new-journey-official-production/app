import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency, ORDER_STATUS_STEPS } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import AdminPagination from "@/components/admin/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminOrders() {
  const [orders, setOrders] = useState<ApiRow[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");

  const load = () => {
    const params: Record<string, string> = {};
    if (status !== "all") params.status = status;
    if (q) params.q = q;
    api.get("/admin/orders", { params }).then((r) => setOrders(r.data));
  };
  useEffect(() => { load(); }, [status, q]);

  const pagination = usePagination(orders, 25, `${status}-${q}`);

  const deleteOrder = async (e: React.MouseEvent, o: ApiRow) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Permanently delete order ${o.order_no}?`)) return;
    try {
      await api.delete(`/admin/orders/${o.id}`);
      toast.success("Order deleted");
      load();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <div className="p-6 lg:p-8" data-testid="admin-orders">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Orders</h1>
          <div className="text-sm text-muted-foreground">{orders.length} matching orders</div>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order # or email" className="h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm w-56" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]" data-testid="admin-orders-status-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ORDER_STATUS_STEPS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Placed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.slice.map((o) => (
              <TableRow key={o.id} className="cursor-pointer">
                <TableCell><Link to={`/admin/orders/${o.id}`} className="font-mono-data font-semibold hover:text-orange-600" data-testid={`admin-order-${o.order_no}`}>{o.order_no}</Link></TableCell>
                <TableCell className="text-sm">{o.user_email}</TableCell>
                <TableCell className="font-mono-data text-sm">{o.items.length}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(o.total)}</TableCell>
                <TableCell><StatusBadge status={o.status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono-data">{o.created_at?.slice(0, 16).replace("T", " ")}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link to={`/admin/orders/${o.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit order"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" title="Delete order" onClick={(e) => deleteOrder(e, o)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <AdminPagination {...pagination} onPageChange={pagination.setPage} />
      </div>
    </div>
  );
}
