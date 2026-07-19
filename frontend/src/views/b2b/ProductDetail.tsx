import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Download, ShoppingBag, Share2, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { B2bProductCard, hasCustomization, trackB2b, whatsappLink } from "@/views/b2b/shared";
import { downloadB2bCatalog, type B2bPdfTemplate } from "@/lib/b2bCatalogPdf";

export default function B2bProductDetail() {
  const { slug } = useParams();
  const [data, setData] = useState<ApiRow | null>(null);
  const [settings, setSettings] = useState<ApiRow | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.get("/b2b/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) return;
    api.get(`/b2b/products/${slug}`)
      .then((r) => setData(r.data))
      .catch((e) => toast.error(apiError(e)));
  }, [slug]);

  if (!data) {
    return <div className="p-8 max-w-7xl mx-auto"><div className="h-96 rounded-xl shimmer" /></div>;
  }

  const product = data.product as ApiRow;
  const related = (data.related as ApiRow[]) || [];
  const images = [product.hero_image, ...(product.gallery || [])].filter(Boolean) as string[];

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const { data: exp } = await api.post("/b2b/catalog/export", {
        mode: "single",
        product_ids: [product.id],
        template: (settings?.default_pdf_template || "modern") as B2bPdfTemplate,
      });
      trackB2b("download", { product_id: product.id });
      await downloadB2bCatalog({
        products: exp.products || [product],
        settings: exp.settings || settings,
        template: (exp.template || "modern") as B2bPdfTemplate,
        title: product.name,
      });
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    trackB2b("share", { product_id: product.id });
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
        return;
      } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const waMsg = `Hi, I'm interested in wholesale pricing for "${product.name}" (MOQ ${product.min_order_qty ?? 1}).`;
  const custLabels = getCustomizationLabels(product.customization as ApiRow);

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <Link to="/b2b/catalog" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-foreground mb-4">
          <ArrowLeft className="h-3 w-3" /> Back to catalog
        </Link>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-border relative">
              {images[imgIdx] ? (
                <img src={images[imgIdx]} alt={product.name} className="h-full w-full object-contain p-4" />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No image</div>
              )}
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white p-2"><ChevronLeft className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setImgIdx((i) => (i + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white p-2"><ChevronRight className="h-4 w-4" /></button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} type="button" onClick={() => setImgIdx(i)} className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-none ${i === imgIdx ? "border-orange-600" : "border-transparent"}`}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {product.featured && <Badge className="bg-orange-600">Featured</Badge>}
              {product.best_seller && <Badge variant="secondary">Best seller</Badge>}
              {hasCustomization(product) && <Badge variant="outline">Customizable</Badge>}
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.sku && <div className="text-sm text-muted-foreground font-mono-data mt-1">SKU: {product.sku}</div>}

            {product.show_price !== false && (
              <div className="mt-4 flex flex-wrap gap-4 items-baseline">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Wholesale</div>
                  <div className="font-mono-data text-2xl font-bold text-orange-600">{formatCurrency(product.wholesale_price || product.offer_price)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">Retail</div>
                  <div className="font-mono-data text-lg text-muted-foreground line-through">{formatCurrency(product.retail_price)}</div>
                </div>
                {settings?.show_dealer_price_public && product.dealer_price > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-widest">Dealer</div>
                    <div className="font-mono-data text-lg">{formatCurrency(product.dealer_price)}</div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {product.show_moq !== false && (
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">MOQ</div>
                  <div className="font-mono-data font-semibold">{product.min_order_qty ?? 1}</div>
                </div>
              )}
              {product.show_lead_time !== false && product.lead_time && (
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Lead time</div>
                  <div className="font-semibold">{product.lead_time}</div>
                </div>
              )}
              {product.material && (
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Material</div>
                  <div className="font-semibold">{product.material}</div>
                </div>
              )}
              {product.production_time && (
                <div className="rounded-lg border border-border p-3">
                  <div className="text-xs text-muted-foreground">Production</div>
                  <div className="font-semibold">{product.production_time}</div>
                </div>
              )}
            </div>

            {(product.colors as ApiRow[])?.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Available colors</div>
                <div className="flex flex-wrap gap-2">
                  {(product.colors as ApiRow[]).map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                      <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {custLabels.length > 0 && (
              <div className="mt-6">
                <div className="text-sm font-medium mb-2">Customization options</div>
                <div className="flex flex-wrap gap-2">
                  {custLabels.map((l) => <Badge key={l} variant="secondary">{l}</Badge>)}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={`/b2b/quote?product=${product.slug || product.id}`}>
                <Button className="gap-2 bg-orange-600 hover:bg-orange-700"><ShoppingBag className="h-4 w-4" /> Place order</Button>
              </Link>
              {product.is_downloadable !== false && (
                <Button variant="outline" className="gap-2" onClick={downloadPdf} disabled={downloading}>
                  <Download className="h-4 w-4" /> {downloading ? "Preparing…" : "Download PDF"}
                </Button>
              )}
              <a href={whatsappLink(settings?.whatsapp_number, waMsg)} target="_blank" rel="noopener noreferrer" onClick={() => trackB2b("whatsapp", { product_id: product.id })}>
                <Button variant="outline" className="gap-2">WhatsApp</Button>
              </a>
              <Button variant="ghost" size="icon" onClick={share}><Share2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Description sections */}
        <div className="mt-16 grid lg:grid-cols-2 gap-8">
          {[
            ["overview", "Overview"],
            ["features", "Features"],
            ["applications", "Applications"],
            ["benefits", "Benefits"],
            ["specifications", "Specifications"],
            ["package_contents", "Package contents"],
            ["care_instructions", "Care instructions"],
          ].map(([key, label]) => product[key] ? (
            <section key={key} className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display font-semibold mb-3">{label}</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line">{product[key]}</div>
            </section>
          ) : null)}
        </div>

        {/* FAQs */}
        {(product.faqs as ApiRow[])?.length > 0 && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold mb-6">FAQs</h2>
            <div className="space-y-3 max-w-3xl">
              {(product.faqs as ApiRow[]).map((faq, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="font-medium">{faq.question}</div>
                  <div className="text-sm text-muted-foreground mt-2">{faq.answer}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="font-display text-xl font-bold mb-6">Related products</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.slice(0, 4).map((p) => (
                <B2bProductCard key={p.id} product={p} settings={settings} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function getCustomizationLabels(custom: ApiRow | undefined): string[] {
  if (!custom) return [];
  const map: [string, string][] = [
    ["custom_logo", "Custom Logo"],
    ["custom_name", "Custom Name"],
    ["custom_text", "Custom Text"],
    ["upload_image", "Upload Image"],
    ["business_branding", "Business Branding"],
    ["private_label", "Private Label"],
    ["packaging_branding", "Packaging Branding"],
  ];
  return map.filter(([k]) => custom[k]).map(([, l]) => l);
}
