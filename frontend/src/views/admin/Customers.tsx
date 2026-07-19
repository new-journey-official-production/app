import React, { useEffect, useState } from "react";
import { Edit } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import AdminPagination from "@/components/admin/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminCustomers() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [view, setView] = useState<ApiRow | null>(null);

  useEffect(() => { api.get("/admin/customers").then((r) => setItems(r.data)); }, []);

  const pagination = usePagination(items, 25, items.length);

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Customers</h1>
      <div className="text-sm text-muted-foreground mb-6">{items.length} accounts</div>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Lifetime spend</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {pagination.slice.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-sm">{u.email}</TableCell>
                <TableCell className="text-sm font-mono-data">{u.phone || "—"}</TableCell>
                <TableCell className="font-mono-data">{u.orders_count}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(u.lifetime_spend)}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono-data">{u.created_at?.slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="View details" onClick={() => setView(u)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <AdminPagination {...pagination} onPageChange={pagination.setPage} />
      </div>

      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Customer details</DialogTitle></DialogHeader>
          {view && (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Name</dt><dd className="font-medium">{view.name}</dd>
              <dt className="text-muted-foreground">Email</dt><dd>{view.email}</dd>
              <dt className="text-muted-foreground">Phone</dt><dd className="font-mono-data">{view.phone || "—"}</dd>
              <dt className="text-muted-foreground">Orders</dt><dd className="font-mono-data">{view.orders_count}</dd>
              <dt className="text-muted-foreground">Lifetime spend</dt><dd className="font-mono-data">{formatCurrency(view.lifetime_spend)}</dd>
              <dt className="text-muted-foreground">Joined</dt><dd className="font-mono-data">{view.created_at?.slice(0, 10)}</dd>
              <dt className="text-muted-foreground">Role</dt><dd className="capitalize">{view.role || "customer"}</dd>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
