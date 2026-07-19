import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Search, Copy } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import AdminPagination from "@/components/admin/AdminPagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function B2bProducts() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const load = () => {
    const params: ApiRow = { limit: 200 };
    if (q.trim()) params.q = q.trim();
    if (status !== "all") params.status = status;
    api.get("/admin/b2b/products", { params })
      .then((r) => { setItems(r.data.items || []); setTotal(r.data.total ?? 0); })
      .catch((e) => toast.error(apiError(e)));
  };

  useEffect(() => { load(); }, [status]);

  const search = (e: React.FormEvent) => { e.preventDefault(); load(); };

  const del = async (id: string) => {
    if (!window.confirm("Delete this B2B product?")) return;
    try {
      await api.delete(`/admin/b2b/products/${id}`);
      toast.success("Deleted");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const duplicate = async (id: string) => {
    try {
      await api.post(`/admin/b2b/products/${id}/duplicate`);
      toast.success("Product duplicated");
      load();
    } catch (e) { toast.error(apiError(e)); }
  };

  const pagination = usePagination(items, 25, `${status}-${q}`);

  return (
    <div className="p-6 lg:p-8" data-testid="b2b-products">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">B2B Products</h1>
          <div className="text-sm text-muted-foreground">{total} wholesale products</div>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <form onSubmit={search} className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm w-48" />
          </form>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/admin/b2b/products/new">
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700"><Plus className="h-4 w-4" /> New product</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Wholesale</TableHead>
              <TableHead>MOQ</TableHead>
              <TableHead>Views</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.slice.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
                      {p.hero_image && <img src={p.hero_image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.sku || p.slug}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.status === "published" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800"}`}>
                    {p.status || "draft"}
                  </span>
                </TableCell>
                <TableCell className="font-mono-data">{formatCurrency(p.wholesale_price)}</TableCell>
                <TableCell className="font-mono-data">{p.min_order_qty ?? 1}</TableCell>
                <TableCell className="font-mono-data text-muted-foreground">{p.views_count ?? 0}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/admin/b2b/products/${p.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicate(p.id)}><Copy className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No products found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <AdminPagination {...pagination} onPageChange={pagination.setPage} />
      </div>
    </div>
  );
}
