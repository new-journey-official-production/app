import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Zap, ShieldCheck, Truck, Sparkles, Star, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiRow, Product } from "@/types";
import { CATEGORIES, formatCurrency } from "@/lib/constants";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

const CATEGORY_IMG = {
  kitchen: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
  "home-utility": "https://images.unsplash.com/photo-1616047006789-b7af5afb8c20?w=800",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800",
  education: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800",
  farming: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800",
  decoration: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800",
  religious: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800",
  automotive: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
  "mobile-accessories": "https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?w=800",
  gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
  gifts: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=800",
  "custom-prints": "https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800",
  accessories: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800",
};

export default function Home() {
  const [featured, setFeatured] = useState<ApiRow[]>([]);
  const [latest, setLatest] = useState<ApiRow[]>([]);

  useEffect(() => {
    api.get("/products", { params: { featured: true, limit: 8 } }).then((r) => setFeatured(r.data.items)).catch(() => {});
    api.get("/products", { params: { sort: "newest", limit: 8 } }).then((r) => setLatest(r.data.items)).catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" data-testid="home-hero">
        <div className="absolute inset-0 -z-10">
          <img
            src="https://images.unsplash.com/photo-1638959492386-f9a68d55c374?w=1800"
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/60 to-background" />
          <div className="absolute inset-0 grain opacity-40" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-28 sm:py-36 lg:py-44">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 backdrop-blur px-3 py-1 text-xs uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 pulse-dot" />
              Now printing — 4 machines live
            </div>
            <h1 className="mt-6 font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95] max-w-4xl text-balance">
              Everyday objects.<br />
              <span className="text-orange-600">Manufactured</span> just for you.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              {BRAND_NAME} is a small studio printing thoughtful, useful things — one layer at a time. Order in seconds, on your desk in days.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/products">
                <Button size="lg" className="bg-zinc-950 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 gap-2 rounded-full" data-testid="hero-shop-btn">
                  Explore the shop <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products/category/custom-prints">
                <Button size="lg" variant="outline" className="rounded-full" data-testid="hero-custom-btn">
                  Custom print for me
                </Button>
              </Link>
            </div>
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl">
              {[
                { n: "12,400+", l: "Prints delivered" },
                { n: "4.9★", l: "Average rating" },
                { n: "48hr", l: "Studio turnaround" },
                { n: "13", l: "Product categories" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-mono-data text-2xl font-semibold">{s.n}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured products */}
      <Section title="Featured this week" subtitle="Prints our studio is loving right now.">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featured.slice(0, 8).map((p) => <ProductCard key={p.id} product={p as Product} />)}
        </div>
      </Section>

      {/* Shop by Category */}
      <Section title="Shop by intent" subtitle="Thirteen focused categories — from kitchen to gaming.">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="home-categories">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              to={`/products/category/${c.slug}`}
              data-testid={`home-category-${c.slug}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border"
            >
              <img src={CATEGORY_IMG[c.slug]} alt={c.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                <div className="font-display text-lg font-semibold">{c.name}</div>
                <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* Why Choose Us */}
      <section className="bg-zinc-50 dark:bg-zinc-900/40 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-orange-600 font-semibold">Why {BRAND_NAME}</div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-bold tracking-tight">Made by hand, guided by machine.</h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Same-week studio time", body: "Most orders enter the printer within 24 hours of payment." },
              { icon: ShieldCheck, title: "Inspected before shipping", body: "Every piece is manually checked for surface finish, tolerance and fit." },
              { icon: Truck, title: "Free shipping over ₹999", body: "Nationwide dispatch. Track every layer of the journey." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600 text-white">
                  <f.icon className="h-6 w-6" />
                </div>
                <div className="mt-6 font-display text-xl font-semibold">{f.title}</div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How 3D Printing Works */}
      <Section title="How 3D printing works" subtitle="From an idea in your head to a physical object at your door — layer by patient layer.">
        <div className="grid md:grid-cols-4 gap-4 sm:gap-6" data-testid="home-how-it-works">
          {[
            { n: "01", t: "Design", d: "Pick from our catalog or send an STL for a custom print." },
            { n: "02", t: "Slice", d: "Our software translates the design into precise machine instructions." },
            { n: "03", t: "Print", d: "A heated nozzle deposits plastic in 0.2mm-thin layers, hours at a time." },
            { n: "04", t: "Finish", d: "Supports removed, edges cleaned, packed with care and dispatched." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-border p-6">
              <div className="font-mono-data text-xs text-muted-foreground tracking-widest">{s.n}</div>
              <div className="mt-3 font-display text-xl font-semibold">{s.t}</div>
              <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.d}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Latest */}
      <Section title="Fresh off the print bed" subtitle="Newest additions to the catalog.">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {latest.slice(0, 8).map((p) => <ProductCard key={p.id} product={p as Product} />)}
        </div>
      </Section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Anika R.", role: "Interior designer", quote: "The Voronoi vase completely re-anchored a client's living room. Genuinely museum-grade finish.", avatar: "https://images.unsplash.com/photo-1758599543147-86dc1512bd5b?w=200" },
            { name: "Devansh K.", role: "Automotive tinkerer", quote: "Sent them my dash-mount CAD. In four days I had it in-hand. Better than what I could buy off the shelf.", avatar: "https://images.unsplash.com/photo-1780733058439-b8952315e59c?w=200" },
            { name: "Sneha P.", role: "Teacher", quote: "Bought a batch of anatomy models. My students actually get it now.", avatar: "https://images.unsplash.com/photo-1758599543147-86dc1512bd5b?w=200" },
          ].map((t) => (
            <figure key={t.name} className="rounded-2xl border border-border bg-card p-8">
              <div className="flex items-center gap-1 text-amber-500 mb-4">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <blockquote className="text-lg leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <img src={t.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white p-10 sm:p-16">
          <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-orange-600/30 blur-3xl" />
          <div className="relative max-w-2xl">
            <Sparkles className="h-6 w-6 text-orange-400" />
            <h2 className="mt-4 font-display text-3xl sm:text-5xl font-bold tracking-tight">Got an STL? We've got a printer waiting.</h2>
            <p className="mt-4 text-white/70 leading-relaxed">Upload your design, pick a material and colour, and we'll quote it within the hour. No minimums.</p>
            <div className="mt-8 flex gap-3">
              <Link to="/products/category/custom-prints">
                <Button size="lg" className="rounded-full bg-orange-600 hover:bg-orange-700 gap-2" data-testid="cta-custom-btn">
                  Start a custom print <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact"><Button size="lg" variant="outline" className="rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white">Talk to us</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-2 text-muted-foreground max-w-xl">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
