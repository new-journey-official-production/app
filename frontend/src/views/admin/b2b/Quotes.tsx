import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { statusLabel } from "@/lib/constants";
import AdminPagination from "@/components/admin/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["pending", "contacted", "quoted", "won", "lost"];

export default function B2bQuotes() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [filter, setFilter] = useState("all");

  const load = () => {
    const params: ApiRow = { limit: 200 };
    if (filter !== "all") params.status = filter;
    api.get("/admin/b2b/quotes", { params })
      .then((r) => setItems(r.data.items || []))
      .catch((e) => toast.error(apiError(e)));
  };

  useEffect(() => { load(); }, [filter]);

  const pagination = usePagination(items, 25, filter);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/b2b/quotes/${id}`, { status });
      toast.success("Status updated");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this quote request?")) return;
    try {
      await api.delete(`/admin/b2b/quotes/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Quote Requests</h1>
          <div className="text-sm text-muted-foreground">{items.length} requests</div>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.slice.map((q) => (
              <TableRow key={q.id}>
                <TableCell>
                  <div className="font-medium">{q.business_name}</div>
                  <div className="text-xs text-muted-foreground">{q.owner_name}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{q.email}</div>
                  <div className="text-xs text-muted-foreground">{q.phone}</div>
                </TableCell>
                <TableCell className="text-sm max-w-[160px] truncate">{q.product_name || "—"}</TableCell>
                <TableCell className="font-mono-data">{q.quantity}</TableCell>
                <TableCell>
                  <Select value={q.status || "pending"} onValueChange={(v) => updateStatus(q.id, v)}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono-data">{q.created_at?.slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(q.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No quote requests</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <AdminPagination {...pagination} onPageChange={pagination.setPage} />
      </div>
    </div>
  );
}
