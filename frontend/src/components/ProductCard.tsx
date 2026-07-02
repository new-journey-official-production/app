import React, { type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { api, apiError } from "@/lib/api";
import { formatCurrency } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product & {
    category_slug?: string;
    rating_avg?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { add } = useCart();
  const { user } = useAuth();
  const priceNow = product.discount_price || product.price;
  const hasDiscount = product.discount_price && product.discount_price < product.price;

  const wishlist = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return toast.error("Login to save to wishlist");
    try {
      await api.post(`/wishlist/${product.id}`);
      toast.success("Added to wishlist");
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const addToCart = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    add(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Link
      to={`/product/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
        )}
        {hasDiscount && product.discount_price != null && (
          <Badge className="absolute top-3 left-3 bg-orange-600 hover:bg-orange-600 text-white font-mono-data">
            -{Math.round((1 - product.discount_price / product.price) * 100)}%
          </Badge>
        )}
        <button
          onClick={wishlist}
          aria-label="Add to wishlist"
          data-testid={`wishlist-btn-${product.slug}`}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-opacity hover:text-orange-600"
        >
          <Heart className="h-4 w-4" />
        </button>
        <button
          onClick={addToCart}
          data-testid={`add-to-cart-${product.slug}`}
          className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 rounded-full bg-zinc-950/90 text-white text-sm font-medium py-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all"
        >
          <ShoppingCart className="h-4 w-4" /> Quick add
        </button>
      </div>
      <div className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>{product.material}</span>
          <span>•</span>
          <span>{product.category_slug?.replace(/-/g, " ")}</span>
        </div>
        <div className="font-display font-semibold text-base leading-snug line-clamp-2">{product.name}</div>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="font-mono-data font-semibold">{formatCurrency(priceNow)}</div>
            {hasDiscount && (
              <div className="text-xs text-muted-foreground line-through font-mono-data">
                {formatCurrency(product.price)}
              </div>
            )}
          </div>
          {(product.rating_avg ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-mono-data">{product.rating_avg}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
