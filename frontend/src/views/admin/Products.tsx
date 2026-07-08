import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ProductBulkImport from "@/views/admin/ProductBulkImport";

export default function AdminProducts() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const [q, setQ] = useState("");

  const load = () => api.get("/products", { params: { limit: 200 } }).then((r) => setItems(r.data.items));
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  const filtered = items.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-6 lg:p-8" data-testid="admin-products">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Products</h1>
          <div className="text-sm text-muted-foreground">{items.length} items in catalog</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm w-56" data-testid="admin-products-search" />
          </div>
          <ProductBulkImport onDone={load} />
          <Link to="/admin/products/new">
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700" data-testid="admin-new-product-btn"><Plus className="h-4 w-4" /> New product</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id} data-testid={`admin-product-row-${p.slug}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none flex items-center justify-center p-0.5">
                      {p.images?.[0] ? <img src={p.images[0]} alt="" className="max-h-full max-w-full object-contain" /> : null}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{p.category_slug?.replace(/-/g, " ")}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-sm">{p.category_slug?.replace(/-/g, " ")}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(p.discount_price || p.price)}</TableCell>
                <TableCell className="font-mono-data">{p.stock}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/admin/products/${p.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit"><Edit className="h-4 w-4" /></Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => del(p.id)} data-testid={`admin-delete-${p.slug}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
