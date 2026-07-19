/**
 * Shared B2B portal helpers and UI primitives.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Download, Eye, ShoppingBag, Palette } from "lucide-react";
import { api } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import { BRAND_PHONE } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Fire-and-forget analytics event to the B2B track endpoint. */
export function trackB2b(event_type: string, extra: ApiRow = {}) {
  api.post("/b2b/track", {
    event_type,
    device: "web",
    country: "IN",
    ...extra,
  }).catch(() => {});
}

/** Builds a WhatsApp deep-link with optional pre-filled message. */
export function whatsappLink(number: string | undefined, message: string): string {
  const phone = (number || BRAND_PHONE).replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/** Returns true when any customization toggle is enabled on a product. */
export function hasCustomization(product: ApiRow): boolean {
  const c = product.customization as ApiRow | undefined;
  if (!c) return false;
  return Object.values(c).some(Boolean);
}

interface B2bProductCardProps {
  product: ApiRow;
  settings?: ApiRow | null;
  onDownload?: (product: ApiRow) => void;
}

/** Compact product card for catalog grids — action buttons pinned to card bottom. */
export function B2bProductCard({ product, settings, onDownload }: B2bProductCardProps) {
  const img = product.hero_image || product.gallery?.[0];
  const slug = product.slug || product.id;

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-orange-300 dark:hover:border-orange-800 transition-colors h-full">
      <Link to={`/b2b/product/${slug}`} className="block aspect-[4/3] bg-white dark:bg-zinc-900 overflow-hidden flex items-center justify-center p-2">
        {img ? (
          <img src={img} alt={product.name} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex-1">
          <Link to={`/b2b/product/${slug}`} className="font-display font-semibold hover:text-orange-600 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </Link>
          {product.show_price !== false && (
            <div className="mt-1 font-mono-data text-orange-600 font-semibold">
              {formatCurrency(product.wholesale_price || product.offer_price)}
              <span className="text-xs text-muted-foreground font-normal ml-1">wholesale</span>
            </div>
          )}
          {product.show_moq !== false && (
            <div className="text-xs text-muted-foreground mt-0.5">MOQ: {product.min_order_qty ?? product.recommended_moq ?? 1}</div>
          )}
        </div>

        <div className="flex flex-wrap gap-1">
          {hasCustomization(product) && (
            <Badge variant="secondary" className="text-[10px] gap-1"><Palette className="h-3 w-3" /> Customizable</Badge>
          )}
          {product.featured && <Badge className="text-[10px] bg-orange-600">Featured</Badge>}
        </div>

        {(product.colors as ApiRow[])?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(product.colors as ApiRow[]).slice(0, 6).map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span
                  title={String(c.name)}
                  className="h-3.5 w-3.5 rounded-full border border-border"
                  style={{ backgroundColor: String(c.hex || "#ccc") }}
                />
                {c.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-1 mt-auto">
          <Link to={`/b2b/product/${slug}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs"><Eye className="h-3 w-3" /> View</Button>
          </Link>
          {product.is_downloadable !== false && onDownload && (
            <Button variant="outline" size="sm" className="shrink-0 gap-1 text-xs px-2" onClick={() => onDownload(product)} aria-label="Download PDF">
              <Download className="h-3 w-3" />
            </Button>
          )}
          <Link to={`/b2b/quote?product=${slug}`} className="flex-1">
            <Button size="sm" className="w-full gap-1 text-xs bg-orange-600 hover:bg-orange-700">
              <ShoppingBag className="h-3 w-3" /> Order
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}
