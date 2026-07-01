import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Search, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, apiError, API_BASE } from "@/lib/api";
import { formatCurrency } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [importing, setImporting] = useState(false);
  const importRef = useRef(null);

  const load = () => api.get("/products", { params: { limit: 200 } }).then((r) => setItems(r.data.items));
  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); toast.success("Deleted"); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  const exportCsv = () => {
    // The API returns the file with auth cookies; open in same tab via anchor download.
    const a = document.createElement("a");
    a.href = `${API_BASE}/admin/products/export`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const importCsv = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/products/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported: ${data.created} created · ${data.updated} updated${data.errors.length ? ` · ${data.errors.length} errors` : ""}`);
      load();
    } catch (e) { toast.error(apiError(e)); }
    finally { setImporting(false); if (importRef.current) importRef.current.value = ""; }
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
          <input ref={importRef} type="file" accept=".csv" hidden onChange={(e) => importCsv(e.target.files?.[0])} data-testid="admin-import-input" />
          <Button variant="outline" onClick={() => importRef.current?.click()} disabled={importing} className="gap-2" data-testid="admin-import-btn">
            <Upload className="h-4 w-4" /> {importing ? "Importing…" : "Import CSV"}
          </Button>
          <Button variant="outline" onClick={exportCsv} className="gap-2" data-testid="admin-export-btn">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
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
                    <div className="h-10 w-10 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.material}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-sm">{p.category_slug?.replace(/-/g, " ")}</TableCell>
                <TableCell className="font-mono-data">{formatCurrency(p.discount_price || p.price)}</TableCell>
                <TableCell className="font-mono-data">{p.stock}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to={`/admin/products/${p.id}/edit`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
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
