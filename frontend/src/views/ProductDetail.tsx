import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Heart, ShoppingCart, Share2, Star, Package, Ruler, Weight, Clock, ShieldCheck } from "lucide-react";
import { api, apiError } from "@/lib/api";
import type { ApiRow, Product } from "@/types";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ProductCard from "@/components/ProductCard";

export default function ProductDetail() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<ApiRow | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [variant, setVariant] = useState<string | null>(null);
  const { add } = useCart();
  const { user } = useAuth();
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    setImgIdx(0);
    api.get(`/products/${slug}`).then((r) => {
      setData(r.data);
      setVariant(r.data.product.color_variants?.[0] || null);
    }).catch(() => toast.error("Product not found"));
  }, [slug]);

  if (!data?.product) {
    return <div className="mx-auto max-w-7xl px-4 py-24"><div className="h-96 rounded-2xl shimmer" /></div>;
  }

  const p = data.product as ApiRow;
  const priceNow = p.discount_price || p.price;

  const addToCart = () => {
    add(p, qty, variant);
    toast.success(`${p.name} added to cart`);
  };

  const buyNow = () => {
    add(p, qty, variant);
    nav("/cart");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: p.name, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error("Login to write a review");
    setPosting(true);
    try {
      await api.post("/reviews", { product_id: p.id, ...reviewForm });
      toast.success("Review posted");
      setReviewForm({ rating: 5, title: "", comment: "" });
      const r = await api.get(`/products/${slug}`);
      setData(r.data);
    } catch (err) { toast.error(apiError(err)); }
    finally { setPosting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-xs text-muted-foreground mb-6 flex items-center gap-2" data-testid="breadcrumb">
        <Link to="/">Home</Link> / <Link to="/products">Shop</Link> / <Link to={`/products/category/${p.category_slug}`}>{p.category_slug.replace(/-/g, " ")}</Link> / <span className="text-foreground truncate">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-3xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-border" data-testid="product-hero-image">
            {p.images?.[imgIdx] && <img src={p.images[imgIdx]} alt={p.name} className="h-full w-full object-cover" />}
          </div>
          {(p.images || []).length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
              {p.images.map((img, i) => (
                <button key={i} onClick={() => setImgIdx(i)} className={`h-20 w-20 flex-none rounded-lg overflow-hidden border ${i === imgIdx ? "border-orange-600 ring-2 ring-orange-600/30" : "border-border"}`}>
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{p.material}</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2" data-testid="product-title">{p.name}</h1>
          {p.rating_avg > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.round(p.rating_avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground font-mono-data">{p.rating_avg} ({p.rating_count} reviews)</span>
            </div>
          )}

          <div className="mt-6 flex items-baseline gap-3">
            <div className="font-mono-data text-3xl font-bold" data-testid="product-price">{formatCurrency(priceNow)}</div>
            {p.discount_price && <div className="font-mono-data text-lg text-muted-foreground line-through">{formatCurrency(p.price)}</div>}
            {p.discount_price && (
              <span className="rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 text-xs px-2 py-0.5 font-semibold">
                Save {formatCurrency(p.price - p.discount_price)}
              </span>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">Inclusive of 18% GST.</div>

          <p className="mt-6 text-muted-foreground leading-relaxed">{p.short_description}</p>

          {p.color_variants?.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-foreground/70 mb-2 font-semibold">Colour</div>
              <div className="flex flex-wrap gap-2">
                {p.color_variants.map((c) => (
                  <button
                    key={c}
                    onClick={() => setVariant(c)}
                    data-testid={`variant-${c.toLowerCase().replace(/\s/g, "-")}`}
                    className={`rounded-full border px-3 py-1 text-sm ${variant === c ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950" : "border-border hover:bg-accent"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-2" data-testid="qty-decrease">−</button>
              <div className="w-10 text-center font-mono-data" data-testid="qty-value">{qty}</div>
              <button onClick={() => setQty((q) => Math.min(p.stock || 99, q + 1))} className="px-3 py-2" data-testid="qty-increase">+</button>
            </div>
            <div className="text-sm text-muted-foreground">
              {p.stock > 0 ? <span className="text-emerald-600">In stock · {p.stock} available</span> : <span className="text-red-600">Out of stock</span>}
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <Button size="lg" onClick={addToCart} disabled={p.stock === 0} className="gap-2 rounded-full flex-1 min-w-[180px]" data-testid="add-to-cart-btn">
              <ShoppingCart className="h-4 w-4" /> Add to cart
            </Button>
            <Button size="lg" onClick={buyNow} disabled={p.stock === 0} className="rounded-full bg-orange-600 hover:bg-orange-700 flex-1 min-w-[180px]" data-testid="buy-now-btn">
              Buy now
            </Button>
            <Button variant="outline" size="lg" onClick={share} className="rounded-full gap-2" aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <Spec icon={Package} label="Material" value={p.material} />
            <Spec icon={Weight} label="Weight" value={p.weight_g ? `${p.weight_g}g` : "—"} />
            <Spec icon={Ruler} label="Dimensions" value={p.dimensions || "—"} />
            <Spec icon={Clock} label="Print time" value={p.print_time_hours ? `${p.print_time_hours}h` : "—"} />
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-border p-4 flex items-center gap-3 text-sm">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>Quality-inspected before dispatch · 7-day replacement on defects.</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList data-testid="product-tabs">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({data.reviews.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="prose prose-sm max-w-none dark:prose-invert mt-6 whitespace-pre-line text-muted-foreground leading-relaxed">
            {p.description}
          </TabsContent>
          <TabsContent value="specs" className="mt-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <SpecRow k="Material" v={p.material} />
              <SpecRow k="Weight" v={p.weight_g ? `${p.weight_g} g` : "—"} />
              <SpecRow k="Dimensions" v={p.dimensions || "—"} />
              <SpecRow k="Estimated print time" v={p.print_time_hours ? `${p.print_time_hours} hours` : "—"} />
              <SpecRow k="Colour options" v={p.color_variants?.join(", ") || "Default"} />
              <SpecRow k="Stock" v={p.stock} />
            </dl>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            {user && (
              <form onSubmit={submitReview} className="rounded-2xl border border-border p-6 mb-8" data-testid="review-form">
                <div className="font-display text-lg font-semibold mb-3">Write a review</div>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button type="button" key={r} onClick={() => setReviewForm((f) => ({ ...f, rating: r }))} data-testid={`review-star-${r}`}>
                      <Star className={`h-5 w-5 ${r <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    </button>
                  ))}
                </div>
                <input required placeholder="Title" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-3" data-testid="review-title-input" />
                <textarea required placeholder="Share your experience…" value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm mb-3" data-testid="review-comment-input" />
                <Button type="submit" disabled={posting} data-testid="review-submit-btn">{posting ? "Posting…" : "Post review"}</Button>
              </form>
            )}
            <div className="space-y-4">
              {data.reviews.length === 0 && <div className="text-sm text-muted-foreground">No reviews yet. Be the first.</div>}
              {data.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-border p-5" data-testid={`review-${r.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{r.user_name}</div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}
                    </div>
                  </div>
                  <div className="font-medium text-sm mt-1">{r.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{r.comment}</div>
                  <div className="text-xs text-muted-foreground mt-2 font-mono-data">{r.created_at?.slice(0, 10)}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {data.related?.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold tracking-tight mb-6">You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {data.related.map((r) => <ProductCard key={r.id} product={r as Product} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function Spec({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border p-3 flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-medium text-sm font-mono-data">{value}</div>
      </div>
    </div>
  );
}

function SpecRow({ k, v }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium font-mono-data">{v}</dd>
    </div>
  );
}
