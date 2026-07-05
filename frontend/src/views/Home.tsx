import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, ShieldCheck, Truck, Sparkles, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiRow, Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

export default function Home() {
  const [featured, setFeatured] = useState<ApiRow[]>([]);
  const [latest, setLatest] = useState<ApiRow[]>([]);
  const [categories, setCategories] = useState<ApiRow[]>([]);

  useEffect(() => {
    api.get("/products", { params: { featured: true, limit: 8 } })
      .then((r) => setFeatured(Array.isArray(r.data?.items) ? r.data.items : []))
      .catch(() => setFeatured([]));
    api.get("/products", { params: { sort: "newest", limit: 8 } })
      .then((r) => setLatest(Array.isArray(r.data?.items) ? r.data.items : []))
      .catch(() => setLatest([]));
    api.get("/categories")
      .then((r) => setCategories(Array.isArray(r.data) ? r.data : []))
      .catch(() => setCategories([]));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden" data-testid="home-hero">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-zinc-100 to-background dark:from-zinc-900 dark:to-background" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-18 lg:py-22">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 backdrop-blur px-3 py-1 text-xs uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 pulse-dot" />
              3D printed · made to order
            </div>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] max-w-3xl text-balance">
              Everyday objects.<br />
              <span className="text-orange-600">Manufactured</span> just for you.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
              {BRAND_NAME} prints thoughtful, useful things — one layer at a time. Browse what is in stock today.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/products">
                <Button size="lg" className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 gap-2 rounded-full" data-testid="hero-shop-btn">
                  Explore the shop <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            {(categories.length > 0 || latest.length > 0) && (
              <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
                {categories.length > 0 && <span><strong className="text-foreground font-mono-data">{categories.length}</strong> categories</span>}
                {latest.length > 0 && <span><strong className="text-foreground font-mono-data">{latest.length}+</strong> products live</span>}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {featured.length > 0 && (
        <Section title="Featured this week" subtitle="Prints marked featured in the admin panel.">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {featured.map((p) => <ProductCard key={p.id} product={p as Product} />)}
          </div>
        </Section>
      )}

      {categories.length > 0 && (
        <Section title="Shop by category" subtitle="Categories you add in the admin panel.">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="home-categories">
            {categories.map((c) => (
              <Link
                key={c.slug}
                to={`/products/category/${c.slug}`}
                data-testid={`home-category-${c.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-zinc-100 dark:bg-zinc-800"
              >
                {c.image ? (
                  <img src={c.image} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">{c.name}</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                  <div className="font-display text-base font-semibold">{c.name}</div>
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <section className="bg-zinc-50 dark:bg-zinc-900/40 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-orange-600 font-semibold">Why {BRAND_NAME}</div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold tracking-tight">Made by hand, guided by machine.</h2>
          </div>
          <div className="mt-8 grid md:grid-cols-3 gap-5">
            {[
              { icon: Zap, title: "Same-week studio time", body: "Most orders enter the printer within 24 hours of payment." },
              { icon: ShieldCheck, title: "Inspected before dispatch", body: "Every piece is checked for surface finish, tolerance and fit." },
              { icon: Truck, title: "Nationwide delivery", body: "Track your order from print bed to doorstep." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-600 text-white">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 font-display text-lg font-semibold">{f.title}</div>
                <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <Section title="Fresh off the print bed" subtitle="Newest products from your catalog.">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {latest.map((p) => <ProductCard key={p.id} product={p as Product} />)}
          </div>
        </Section>
      )}

      {featured.length === 0 && latest.length === 0 && categories.length === 0 && (
        <Section title="Catalog coming soon" subtitle="Add categories and products from the admin panel — they will appear here automatically.">
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No products yet. Sign in to admin and add your first product.
          </div>
        </Section>
      )}

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-14">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-8 sm:p-12">
          <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-orange-600/30 blur-3xl" />
          <div className="relative max-w-xl">
            <Sparkles className="h-5 w-5 text-orange-400" />
            <h2 className="mt-3 font-display text-2xl sm:text-4xl font-bold tracking-tight">Need something custom?</h2>
            <p className="mt-3 text-white/70 leading-relaxed">Get in touch — we can quote a one-off print from your design file.</p>
            <div className="mt-6">
              <Link to="/contact">
                <Button size="lg" className="rounded-full bg-orange-600 hover:bg-orange-700 gap-2" data-testid="cta-custom-btn">
                  Talk to us <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <div className="mb-6">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground max-w-xl">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
