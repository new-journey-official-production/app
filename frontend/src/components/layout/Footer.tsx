import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Instagram, Twitter, Youtube, Mail } from "lucide-react";
import { api, apiError } from "@/lib/api";
import { CATEGORIES } from "@/lib/constants";
import { BRAND_NAME, BRAND_SHORT, BRAND_STUDIO, BRAND_EMAIL_HELLO } from "@/lib/brand";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post("/newsletter", { email });
      toast.success("Subscribed. Watch your inbox.");
      setEmail("");
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="border-t border-border/60 bg-zinc-50 dark:bg-zinc-900/50" data-testid="footer">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 font-display font-bold text-sm">{BRAND_SHORT}</div>
              <span className="font-display font-bold text-xl">{BRAND_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Precision-printed everyday objects. Designed thoughtfully, manufactured additively, delivered fast.
            </p>
            <form onSubmit={subscribe} className="mt-6 flex gap-2 max-w-md">
              <input
                data-testid="footer-newsletter-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/40"
              />
              <button
                data-testid="footer-newsletter-btn"
                type="submit"
                disabled={loading}
                className="rounded-md bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 font-medium transition disabled:opacity-60"
              >
                {loading ? "…" : "Subscribe"}
              </button>
            </form>
            <div className="mt-6 flex items-center gap-2 text-muted-foreground">
              <a href="#" aria-label="Instagram" className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"><Instagram className="h-4 w-4" /></a>
              <a href="#" aria-label="Twitter" className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"><Twitter className="h-4 w-4" /></a>
              <a href="#" aria-label="YouTube" className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"><Youtube className="h-4 w-4" /></a>
              <a href={`mailto:${BRAND_EMAIL_HELLO}`} aria-label="Email" className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"><Mail className="h-4 w-4" /></a>
            </div>
          </div>

          <FooterCol title="Shop">
            {CATEGORIES.slice(0, 6).map((c) => (
              <Link key={c.slug} to={`/products/category/${c.slug}`} className="block py-1 hover:text-foreground">{c.name}</Link>
            ))}
            <Link to="/products" className="block py-1 hover:text-foreground">All products</Link>
          </FooterCol>

          <FooterCol title="Company">
            <Link to="/about" className="block py-1 hover:text-foreground">About</Link>
            <Link to="/blog" className="block py-1 hover:text-foreground">Journal</Link>
            <Link to="/contact" className="block py-1 hover:text-foreground">Contact</Link>
            <Link to="/faq" className="block py-1 hover:text-foreground">FAQ</Link>
          </FooterCol>

          <FooterCol title="Legal">
            <Link to="/privacy" className="block py-1 hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="block py-1 hover:text-foreground">Terms</Link>
            <Link to="/refund-policy" className="block py-1 hover:text-foreground">Refunds</Link>
            <Link to="/shipping-policy" className="block py-1 hover:text-foreground">Shipping</Link>
          </FooterCol>
        </div>

        <div className="mt-14 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
          <div>© {new Date().getFullYear()} {BRAND_STUDIO}. Printed with care.</div>
          <div className="font-mono-data">v1.0.0</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] mb-3 text-foreground/70 font-semibold">{title}</div>
      <div className="space-y-0.5 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
