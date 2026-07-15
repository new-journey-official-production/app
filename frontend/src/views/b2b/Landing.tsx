import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Download, MessageSquareQuote, Handshake, Factory, Shield, Clock, Layers,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { BRAND_STUDIO } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { B2bProductCard, trackB2b } from "@/views/b2b/shared";
import { downloadB2bCatalog, type B2bPdfTemplate } from "@/lib/b2bCatalogPdf";

const INDUSTRIES = ["Retail & Gifts", "Corporate Gifting", "Education", "Automotive", "Home & Kitchen", "Promotional Products"];
const PROCESS = [
  { step: "01", title: "Browse catalog", desc: "Explore wholesale products with MOQ and customization options." },
  { step: "02", title: "Request quote", desc: "Share quantity, branding needs, and delivery timeline." },
  { step: "03", title: "Sample & approve", desc: "Review prototypes before bulk production begins." },
  { step: "04", title: "Manufacture & ship", desc: "Industrial-grade 3D printing at scale with QC." },
];
const WHY_US = [
  { icon: Factory, title: "Bulk manufacturing", desc: "Production capacity for thousands of units per order." },
  { icon: Layers, title: "Full customization", desc: "Logo, colors, packaging, and private label options." },
  { icon: Shield, title: "Quality assured", desc: "Layer-by-layer inspection and material traceability." },
  { icon: Clock, title: "Reliable lead times", desc: "Transparent MOQ, production, and delivery schedules." },
];
const FAQS = [
  { q: "What is the minimum order quantity?", a: "MOQ varies by product — typically 50–500 units. Each product page shows specific MOQ." },
  { q: "Do you offer custom branding?", a: "Yes. Logo embossing, custom colors, private label packaging, and business branding are available on most products." },
  { q: "How do I get wholesale pricing?", a: "Browse the catalog for indicative wholesale rates, or submit a quote request for volume pricing." },
  { q: "Can I become an authorized dealer?", a: "Apply through our dealer program. Approved partners receive dealer pricing and dedicated support." },
];

export default function B2bLanding() {
  const [settings, setSettings] = useState<ApiRow | null>(null);
  const [categories, setCategories] = useState<ApiRow[]>([]);
  const [featured, setFeatured] = useState<ApiRow[]>([]);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get("/b2b/settings").then((r) => setSettings(r.data)).catch(() => {});
    api.get("/b2b/categories").then((r) => setCategories((r.data.items || []).slice(0, 8))).catch(() => {});
    api.get("/b2b/products", { params: { featured: true, limit: 8 } })
      .then((r) => setFeatured(r.data.items || []))
      .catch(() => {});
  }, []);

  const downloadFullCatalog = async () => {
    setDownloading(true);
    try {
      const { data } = await api.post("/b2b/catalog/export", {
        mode: "featured",
        template: (settings?.default_pdf_template || "modern") as B2bPdfTemplate,
      });
      trackB2b("download");
      await downloadB2bCatalog({
        products: data.products || [],
        settings: data.settings || settings,
        template: (data.template || "modern") as B2bPdfTemplate,
      });
      toast.success("Catalog downloaded");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setDownloading(false);
    }
  };

  const tagline = settings?.tagline || "Bulk Manufacturing & Wholesale 3D Printing Solutions";

  return (
    <div className="pb-20">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-background to-zinc-100 dark:from-orange-950/30 dark:via-background dark:to-zinc-950" />
        {settings?.hero_image && (
          <div className="absolute inset-0 opacity-10">
            <img src={settings.hero_image} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-[0.2em] text-orange-600 font-mono-data mb-4">B2B · Wholesale</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {tagline}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              Partner with {settings?.company_name || BRAND_STUDIO} for scalable 3D-printed products, custom branding, and reliable bulk fulfillment.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/b2b/catalog">
                <Button size="lg" className="gap-2 bg-orange-600 hover:bg-orange-700">Browse catalog <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2" onClick={downloadFullCatalog} disabled={downloading}>
                <Download className="h-4 w-4" /> {downloading ? "Preparing…" : "Download catalog"}
              </Button>
              <Link to="/b2b/quote">
                <Button size="lg" variant="outline" className="gap-2"><MessageSquareQuote className="h-4 w-4" /> Request quote</Button>
              </Link>
              <Link to="/b2b/become-dealer">
                <Button size="lg" variant="ghost" className="gap-2"><Handshake className="h-4 w-4" /> Become a dealer</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-2xl font-bold">Product categories</h2>
            <Link to="/b2b/catalog" className="text-sm text-orange-600 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/b2b/catalog/${c.slug}`}
                className="group rounded-xl border border-border bg-card p-5 hover:border-orange-300 dark:hover:border-orange-800 transition"
              >
                {c.cover_image && (
                  <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-800">
                    <img src={c.cover_image} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="font-display font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.short_description}</div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="bg-zinc-50 dark:bg-zinc-900/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold mb-8">Featured wholesale products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <B2bProductCard key={p.id} product={p} settings={settings} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Industries */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-2xl font-bold mb-8">Industries we serve</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {INDUSTRIES.map((ind) => (
            <div key={ind} className="rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium">{ind}</div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="border-y border-border bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold mb-10 text-center">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {PROCESS.map((p) => (
              <div key={p.step} className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950 text-orange-600 font-mono-data font-bold text-sm mb-3">{p.step}</div>
                <div className="font-display font-semibold">{p.title}</div>
                <div className="text-sm text-muted-foreground mt-2">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-2xl font-bold mb-8">Why partner with us</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WHY_US.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-6">
              <Icon className="h-8 w-8 text-orange-600 mb-4" />
              <div className="font-display font-semibold">{title}</div>
              <div className="text-sm text-muted-foreground mt-2">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display text-2xl font-bold mb-8 text-center">Frequently asked questions</h2>
        <div className="space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-border bg-card p-5">
              <div className="font-medium">{faq.q}</div>
              <div className="text-sm text-muted-foreground mt-2">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact sales CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-zinc-950 dark:bg-zinc-900 text-white p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-2xl font-bold">Ready to scale your product line?</h2>
            <p className="text-zinc-400 mt-2">Contact our sales team for volume pricing and custom manufacturing.</p>
            {settings?.sales_email && <div className="text-sm text-zinc-400 mt-3">{settings.sales_email} · {settings.sales_phone}</div>}
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/b2b/quote"><Button size="lg" className="bg-orange-600 hover:bg-orange-700">Get a quote</Button></Link>
            <Link to="/contact"><Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800">Contact sales</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
