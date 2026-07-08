import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiRow, Product } from "@/types";
import { CATEGORIES } from "@/lib/constants";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Quick-select price bands for common shopping ranges. */
const PRICE_PRESETS = [
  { label: "Under ₹500", min: "", max: "500" },
  { label: "₹500 – ₹1,000", min: "500", max: "1000" },
  { label: "₹1,000 – ₹2,500", min: "1000", max: "2500" },
  { label: "₹2,500+", min: "2500", max: "" },
] as const;

export default function Products() {
  const { slug } = useParams();
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") || "";
  const sort = sp.get("sort") || "newest";
  const minPrice = sp.get("min_price") || "";
  const maxPrice = sp.get("max_price") || "";
  const [items, setItems] = useState<ApiRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [draftMinPrice, setDraftMinPrice] = useState(minPrice);
  const [draftMaxPrice, setDraftMaxPrice] = useState(maxPrice);

  useEffect(() => {
    setDraftMinPrice(minPrice);
    setDraftMaxPrice(maxPrice);
  }, [minPrice, maxPrice]);

  const params = useMemo(() => {
    const p: Record<string, string | number> = { limit: 60, sort };
    if (slug) p.category = slug;
    if (q) p.q = q;
    if (minPrice) p.min_price = minPrice;
    if (maxPrice) p.max_price = maxPrice;
    return p;
  }, [slug, q, sort, minPrice, maxPrice]);

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

  const setParam = (k: string, v: string | null) => {
    const next = new URLSearchParams(sp);
    if (v == null || v === "") next.delete(k);
    else next.set(k, v);
    setSp(next);
  };

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(sp);
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setSp(next);
  };

  const applyPriceFilter = () => {
    setParams({ min_price: draftMinPrice || null, max_price: draftMaxPrice || null });
  };

  const clearAllFilters = () => {
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setSp({});
  };

  const activeFilters = useMemo(() => {
    const filters: { key: string; label: string; clear: () => void }[] = [];
    if (q) filters.push({ key: "q", label: `Search: "${q}"`, clear: () => setParam("q", null) });
    if (minPrice || maxPrice) {
      const label = minPrice && maxPrice
        ? `₹${minPrice} – ₹${maxPrice}`
        : minPrice
          ? `From ₹${minPrice}`
          : `Up to ₹${maxPrice}`;
      filters.push({
        key: "price",
        label,
        clear: () => {
          setDraftMinPrice("");
          setDraftMaxPrice("");
          setParams({ min_price: null, max_price: null });
        },
      });
    }
    return filters;
  }, [q, minPrice, maxPrice, sp]);

  const currentCat = CATEGORIES.find((c) => c.slug === slug);
  const pricePresetActive = (min: string, max: string) => minPrice === min && maxPrice === max;

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

      {activeFilters.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2" data-testid="active-filters">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={f.clear}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium hover:bg-accent transition"
            >
              {f.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`} data-testid="filters-sidebar">
          <div className="sticky top-24 rounded-xl border border-border bg-card p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="font-display font-semibold text-sm">Filters</div>
              {(minPrice || maxPrice || q) && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            <FilterGroup title="Price range">
              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setDraftMinPrice(preset.min);
                      setDraftMaxPrice(preset.max);
                      setParams({ min_price: preset.min || null, max_price: preset.max || null });
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      pricePresetActive(preset.min, preset.max)
                        ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                    data-testid={`filter-price-preset-${preset.min || "0"}-${preset.max || "max"}`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                <Label className="text-xs text-muted-foreground">Custom range (₹)</Label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={draftMinPrice}
                    onChange={(e) => setDraftMinPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    data-testid="filter-min-price"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={draftMaxPrice}
                    onChange={(e) => setDraftMaxPrice(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    data-testid="filter-max-price"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={applyPriceFilter}
                  data-testid="apply-price-filter-btn"
                >
                  Apply price
                </Button>
              </div>
            </FilterGroup>
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

function Chip({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition ${active ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950" : "bg-secondary text-secondary-foreground hover:bg-accent"}`}>
      {children}
    </Link>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest font-semibold text-foreground/70 mb-3">{title}</div>
      {children}
    </div>
  );
}
