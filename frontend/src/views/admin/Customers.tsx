import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminCustomers() {
  const [items, setItems] = useState<ApiRow[]>([]);
  useEffect(() => { api.get("/admin/customers").then((r) => setItems(r.data)); }, []);

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
          </TableRow></TableHeader>
          <TableBody>
            {items.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-sm">{u.email}</TableCell>
                <TableCell className="text-sm font-mono-data">{u.phone || "—"}</TableCell>
                <TableCell className="font-mono-data">{u.orders_count}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(u.lifetime_spend)}</TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono-data">{u.created_at?.slice(0, 10)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
