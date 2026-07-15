import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { statusLabel } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUSES = ["pending", "approved", "rejected", "inactive"];

export default function B2bDealers() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [filter, setFilter] = useState("all");

  const load = () => {
    const params: ApiRow = { limit: 200 };
    if (filter !== "all") params.status = filter;
    api.get("/admin/b2b/dealers", { params })
      .then((r) => setItems(r.data.items || []))
      .catch((e) => toast.error(apiError(e)));
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/admin/b2b/dealers/${id}`, { status });
      toast.success("Dealer updated");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this dealer registration?")) return;
    try {
      await api.delete(`/admin/b2b/dealers/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Dealer Registrations</h1>
          <div className="text-sm text-muted-foreground">{items.length} applications</div>
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
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Business type</TableHead>
              <TableHead>Volume</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <div className="font-medium">{d.company_name}</div>
                  <div className="text-xs text-muted-foreground">{d.gst || "No GST"}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{d.owner_name}</div>
                  <div className="text-xs text-muted-foreground">{d.email} · {d.phone}</div>
                </TableCell>
                <TableCell className="text-sm capitalize">{d.business_type || "—"}</TableCell>
                <TableCell className="text-sm">{d.monthly_purchase_volume || "—"}</TableCell>
                <TableCell>
                  <Select value={d.status || "pending"} onValueChange={(v) => updateStatus(d.id, v)}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No dealer registrations</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
