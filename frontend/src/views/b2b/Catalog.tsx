import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { MATERIALS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { B2bProductCard, trackB2b } from "@/views/b2b/shared";
import { downloadB2bCatalog, type B2bPdfTemplate } from "@/lib/b2bCatalogPdf";

export default function B2bCatalog() {
  const { categorySlug } = useParams();
  const [products, setProducts] = useState<ApiRow[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<ApiRow[]>([]);
  const [settings, setSettings] = useState<ApiRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [q, setQ] = useState("");
  const [material, setMaterial] = useState("");
  const [color, setColor] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [maxMoq, setMaxMoq] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ApiRow | null>(null);

  useEffect(() => {
    api.get("/b2b/settings").then((r) => setSettings(r.data)).catch(() => {});
    api.get("/b2b/categories", { params: { tree: false } })
      .then((r) => {
        const flat = r.data.flat || flattenTree(r.data.items || []);
        setCategories(flat);
        if (categorySlug) {
          const cat = flat.find((c: ApiRow) => c.slug === categorySlug);
          setActiveCategory(cat || null);
          setCategoryId(cat?.id || null);
        }
      })
      .catch(() => {});
  }, [categorySlug]);

  const loadProducts = useCallback(() => {
    setLoading(true);
    const params: ApiRow = { limit: 60, sort };
    if (categoryId) params.category_id = categoryId;
    if (q.trim()) params.q = q.trim();
    if (material) params.material = material;
    if (color) params.color = color;
    if (minPrice) params.min_price = Number(minPrice);
    if (maxPrice) params.max_price = Number(maxPrice);
    if (maxMoq) params.max_moq = Number(maxMoq);
    if (featuredOnly) params.featured = true;

    api.get("/b2b/products", { params })
      .then((r) => { setProducts(r.data.items || []); setTotal(r.data.total ?? 0); })
      .catch((e) => toast.error(apiError(e)))
      .finally(() => setLoading(false));
  }, [categoryId, q, material, color, sort, minPrice, maxPrice, maxMoq, featuredOnly]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const downloadProduct = async (product: ApiRow) => {
    try {
      const { data } = await api.post("/b2b/catalog/export", {
        mode: "single",
        product_ids: [product.id],
        template: (settings?.default_pdf_template || "modern") as B2bPdfTemplate,
      });
      trackB2b("download", { product_id: product.id });
      await downloadB2bCatalog({
        products: data.products || [product],
        settings: data.settings || settings,
        template: (data.template || "modern") as B2bPdfTemplate,
        title: product.name,
      });
      toast.success("Product sheet downloaded");
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="border-b border-border bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-widest text-orange-600 font-mono-data mb-2">Wholesale catalog</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            {activeCategory ? activeCategory.name : "All products"}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            {activeCategory?.short_description || settings?.tagline || "Browse bulk-manufactured 3D printed products with MOQ and customization options."}
          </p>
          {activeCategory?.cover_image && (
            <div className="mt-6 rounded-xl overflow-hidden max-w-2xl aspect-[3/1]">
              <img src={activeCategory.cover_image} alt="" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <form onSubmit={applySearch} className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm" />
          </form>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price ↑</SelectItem>
              <SelectItem value="price_desc">Price ↓</SelectItem>
              <SelectItem value="moq_asc">MOQ ↑</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
        </div>

        {showFilters && (
          <div className="rounded-xl border border-border bg-card p-4 mb-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Material</label>
              <Select value={material || "__all__"} onValueChange={(v) => setMaterial(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  {MATERIALS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <FilterInput label="Color" value={color} onChange={setColor} placeholder="e.g. black" />
            <FilterInput label="Min price" value={minPrice} onChange={setMinPrice} type="number" />
            <FilterInput label="Max price" value={maxPrice} onChange={setMaxPrice} type="number" />
            <FilterInput label="Max MOQ" value={maxMoq} onChange={setMaxMoq} type="number" />
            <label className="flex items-center gap-2 text-sm pt-5">
              <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
              Featured only
            </label>
            <div className="flex items-end">
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setMaterial(""); setColor(""); setMinPrice(""); setMaxPrice(""); setMaxMoq(""); setFeaturedOnly(false); }}>
                <X className="h-3 w-3" /> Clear
              </Button>
            </div>
          </div>
        )}

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Link to="/b2b/catalog">
            <Button variant={!categorySlug ? "default" : "outline"} size="sm" className={!categorySlug ? "bg-orange-600 hover:bg-orange-700" : ""}>All</Button>
          </Link>
          {categories.slice(0, 12).map((c) => (
            <Link key={c.id} to={`/b2b/catalog/${c.slug}`}>
              <Button variant={categorySlug === c.slug ? "default" : "outline"} size="sm" className={categorySlug === c.slug ? "bg-orange-600 hover:bg-orange-700" : ""}>
                {c.name}
              </Button>
            </Link>
          ))}
        </div>

        <div className="text-sm text-muted-foreground mb-4">{total} product{total === 1 ? "" : "s"}</div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-72 rounded-xl shimmer" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No products match your filters.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <B2bProductCard key={p.id} product={p} settings={settings} onDownload={downloadProduct} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1" />
    </div>
  );
}

function flattenTree(items: ApiRow[]): ApiRow[] {
  const out: ApiRow[] = [];
  const walk = (nodes: ApiRow[]) => {
    nodes.forEach((n) => {
      out.push(n);
      if (n.children?.length) walk(n.children as ApiRow[]);
    });
  };
  walk(items);
  return out;
}
