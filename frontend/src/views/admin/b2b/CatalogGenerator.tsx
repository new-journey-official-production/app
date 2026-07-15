import React, { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { downloadB2bCatalog, type B2bPdfTemplate } from "@/lib/b2bCatalogPdf";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const MODES = [
  { value: "complete", label: "Complete catalog" },
  { value: "featured", label: "Featured products" },
  { value: "category", label: "By category" },
  { value: "selection", label: "Selected products" },
  { value: "single", label: "Single product" },
];

const TEMPLATES: { value: B2bPdfTemplate; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "luxury", label: "Luxury" },
  { value: "corporate", label: "Corporate" },
  { value: "minimal", label: "Minimal" },
  { value: "dark", label: "Dark" },
];

export default function B2bCatalogGenerator() {
  const [mode, setMode] = useState("complete");
  const [template, setTemplate] = useState<B2bPdfTemplate>("modern");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<ApiRow[]>([]);
  const [products, setProducts] = useState<ApiRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/admin/b2b/categories", { params: { tree: false } })
      .then((r) => setCategories(r.data.flat || []))
      .catch(() => {});
    api.get("/admin/b2b/products", { params: { limit: 500, status: "published" } })
      .then((r) => setProducts(r.data.items || []))
      .catch(() => {});
  }, []);

  const toggleProduct = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCatalog = async () => {
    setBusy(true);
    try {
      const body: ApiRow = { mode, template };
      if (mode === "category" && categoryId) body.category_id = categoryId;
      if ((mode === "selection" || mode === "single") && selected.size) {
        body.product_ids = Array.from(selected);
        if (mode === "single" && body.product_ids.length > 1) {
          body.product_ids = [body.product_ids[0]];
        }
      }
      if (mode === "selection" && !selected.size) {
        toast.error("Select at least one product");
        setBusy(false);
        return;
      }
      if (mode === "single" && selected.size !== 1) {
        toast.error("Select exactly one product");
        setBusy(false);
        return;
      }

      const { data } = await api.post("/admin/b2b/catalog/export", body);
      await downloadB2bCatalog({
        products: data.products || [],
        settings: data.settings,
        template: (data.template || template) as B2bPdfTemplate,
        title: title || data.settings?.catalog_cover_title,
      });
      toast.success(`Catalog downloaded (${data.products?.length ?? 0} products)`);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 lg:p-8" data-testid="b2b-catalog-generator">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">Catalog Generator</h1>
        <div className="text-sm text-muted-foreground">Export wholesale PDF catalogs for sharing with buyers</div>
      </header>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Export mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">PDF template</Label>
            <Select value={template} onValueChange={(v) => setTemplate(v as B2bPdfTemplate)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Cover title (optional)</Label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Wholesale Catalog 2026" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1" />
          </div>

          {mode === "category" && (
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={categoryId || "__pick__"} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__pick__" disabled>Select category</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button onClick={exportCatalog} disabled={busy} className="w-full gap-2 bg-orange-600 hover:bg-orange-700">
            <Download className="h-4 w-4" /> {busy ? "Generating…" : "Download PDF"}
          </Button>
        </section>

        {(mode === "selection" || mode === "single") && (
          <section className="rounded-xl border border-border bg-card p-6">
            <div className="font-display font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Select products ({selected.size})
            </div>
            <div className="max-h-[480px] overflow-y-auto space-y-2">
              {products.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                  <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                  <div className="h-10 w-10 rounded bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-none">
                    {p.hero_image && <img src={p.hero_image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.sku || p.slug}</div>
                  </div>
                </label>
              ))}
              {products.length === 0 && <div className="text-sm text-muted-foreground">No published products</div>}
            </div>
          </section>
        )}

        {mode !== "selection" && mode !== "single" && (
          <section className="rounded-xl border border-dashed border-border p-8 flex items-center justify-center text-muted-foreground text-sm">
            {mode === "complete" && "Exports all published, visible products in the catalog."}
            {mode === "featured" && "Exports all featured products."}
            {mode === "category" && "Pick a category to export its products."}
          </section>
        )}
      </div>
    </div>
  );
}
