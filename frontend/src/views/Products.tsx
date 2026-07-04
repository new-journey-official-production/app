import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiRow, Product } from "@/types";
import { CATEGORIES, MATERIALS } from "@/lib/constants";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Products() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") || "";
  const material = sp.get("material") || "";
  const sort = sp.get("sort") || "newest";
  const minPrice = sp.get("min_price") || "";
  const maxPrice = sp.get("max_price") || "";
  const [items, setItems] = useState<ApiRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { limit: 60, sort };
    if (slug) p.category = slug;
    if (q) p.q = q;
    if (material) p.material = material;
    if (minPrice) p.min_price = minPrice;
    if (maxPrice) p.max_price = maxPrice;
    return p;
  }, [slug, q, material, sort, minPrice, maxPrice]);

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params })
      .then((r) => {
        setItems(Array.isArray(r.data?.items) ? r.data.items : []);
        setTotal(typeof r.data?.total === "number" ? r.data.total : 0);
      })
      .catch(() => {
        setItems([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [params]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v == null || v === "") next.delete(k);
    else next.set(k, v);
    setSp(next);
  };

  const currentCat = CATEGORIES.find((c) => c.slug === slug);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{currentCat ? "Category" : q ? "Search" : "Catalog"}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">
            {currentCat ? currentCat.name : q ? `Results for "${q}"` : "All products"}
          </h1>
          <div className="text-sm text-muted-foreground mt-1 font-mono-data" data-testid="products-count">{total} items</div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)} className="gap-2 lg:hidden" data-testid="toggle-filters-btn">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </Button>
          <Select value={sort} onValueChange={(v) => setParam("sort", v)}>
            <SelectTrigger className="w-[180px]" data-testid="sort-select"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price_asc">Price: Low → High</SelectItem>
              <SelectItem value="price_desc">Price: High → Low</SelectItem>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2" data-testid="category-chips">
        <Chip active={!slug} to={`/products${q ? `?q=${q}` : ""}`}>All</Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.slug} active={slug === c.slug} to={`/products/category/${c.slug}`}>{c.name}</Chip>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`} data-testid="filters-sidebar">
          <div className="space-y-6 sticky top-24">
            <FilterGroup title="Material">
              <div className="space-y-1">
                <button className={`w-full text-left rounded-md px-3 py-1.5 text-sm ${material === "" ? "bg-accent" : "hover:bg-accent"}`} onClick={() => setParam("material", "")}>All</button>
                {MATERIALS.map((m) => (
                  <button key={m} className={`w-full text-left rounded-md px-3 py-1.5 text-sm ${material === m ? "bg-accent font-semibold" : "hover:bg-accent"}`} onClick={() => setParam("material", m)} data-testid={`filter-material-${m.toLowerCase()}`}>
                    {m}
                  </button>
                ))}
              </div>
            </FilterGroup>
            <FilterGroup title="Price range (₹)">
              <div className="flex gap-2">
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setParam("min_price", e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" data-testid="filter-min-price" />
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setParam("max_price", e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm" data-testid="filter-max-price" />
              </div>
            </FilterGroup>
            {(material || minPrice || maxPrice || q) && (
              <button onClick={() => setSp({})} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>
        </aside>

        <div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-2xl shimmer" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-16 text-center" data-testid="empty-products">
              <div className="font-display text-2xl font-semibold">Nothing here yet</div>
              <div className="mt-2 text-muted-foreground text-sm">Try changing filters or clearing the search.</div>
              <Link to="/products" className="mt-6 inline-block"><Button variant="outline">Reset</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6" data-testid="products-grid">
              {items.map((p) => <ProductCard key={p.id} product={p as Product} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ active, to, children }) {
  return (
    <Link to={to} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${active ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
      {children}
    </Link>
  );
}

function FilterGroup({ title, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest font-semibold text-foreground/70 mb-2">{title}</div>
      {children}
    </div>
  );
}
