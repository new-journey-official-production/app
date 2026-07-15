import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, FolderTree, Download, MessageSquareQuote, Handshake,
  TrendingUp, Eye, Star, BarChart3,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";

export default function B2bAdminDashboard() {
  const [s, setS] = useState<ApiRow | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    api.get("/admin/b2b/dashboard")
      .then((r) => setS(r.data))
      .catch((err) => {
        setS(null);
        setError(apiError(err));
        toast.error(apiError(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-96 rounded-xl shimmer" />
      </div>
    );
  }

  if (error || !s) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">B2B Overview</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{error || "Could not load dashboard"}</p>
          <Button variant="outline" onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8" data-testid="b2b-admin-dashboard">
      <header className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">B2B Overview</h1>
          <div className="text-sm text-muted-foreground">Wholesale catalog performance</div>
        </div>
        <Link to="/admin/b2b/catalog" className="text-sm text-orange-600 hover:underline">Generate catalog →</Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={FolderTree} label="Categories" value={s.total_categories} />
        <Kpi icon={Package} label="Products" value={s.total_products} accent />
        <Kpi icon={Eye} label="Visible" value={s.visible_products} />
        <Kpi icon={Star} label="Featured" value={s.featured_products} />
        <Kpi icon={Download} label="Total downloads" value={s.total_downloads} />
        <Kpi icon={TrendingUp} label="Today downloads" value={s.today_downloads} accent />
        <Kpi icon={MessageSquareQuote} label="Quote requests" value={s.quote_requests} />
        <Kpi icon={Handshake} label="Dealer registrations" value={s.dealer_registrations} />
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <ChartCard title="Downloads · 14 days" data={s.downloads_series} dataKey="count" />
        <ChartCard title="Views · 14 days" data={s.views_series} dataKey="count" color="hsl(221 83% 53%)" />
        <ChartCard title="Quote requests · 14 days" data={s.quotes_series} dataKey="count" color="hsl(142 71% 45%)" />
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-display font-semibold mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Top categories</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={s.top_categories || []} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="count" fill="hsl(22 92% 52%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <HighlightCard
          title="Most downloaded"
          product={s.most_downloaded_product}
          metric={s.most_downloaded_product?.downloads_count}
          label="downloads"
        />
        <HighlightCard
          title="Most viewed"
          product={s.most_viewed_product}
          metric={s.most_viewed_product?.views_count}
          label="views"
        />
      </div>

      {(s.pending_requests ?? 0) > 0 && (
        <div className="mt-6 rounded-xl border border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950/30 p-4 flex items-center justify-between">
          <span className="text-sm">{s.pending_requests} pending quote request{s.pending_requests === 1 ? "" : "s"}</span>
          <Link to="/admin/b2b/quotes" className="text-sm text-orange-600 font-medium hover:underline">Review →</Link>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent = false }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border border-border ${accent ? "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900" : "bg-card"} p-4`}>
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${accent ? "text-orange-600" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-2 font-mono-data text-2xl font-bold">{value ?? 0}</div>
    </div>
  );
}

function ChartCard({ title, data, dataKey, color = "hsl(22 92% 52%)" }: { title: string; data: ApiRow[]; dataKey: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-display font-semibold mb-4">{title}</div>
      <div className="h-64">
        <ResponsiveContainer>
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => String(d).slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function HighlightCard({ title, product, metric, label }: { title: string; product?: ApiRow | null; metric?: number; label: string }) {
  if (!product) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="font-display font-semibold mb-2">{title}</div>
        <div className="text-sm text-muted-foreground">No data yet</div>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-display font-semibold mb-3">{title}</div>
      <Link to={`/admin/b2b/products/${product.id}/edit`} className="flex items-center gap-3 hover:bg-accent rounded-lg p-2 -m-2 transition">
        <div className="h-12 w-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
          {product.hero_image && <img src={product.hero_image} alt="" className="h-full w-full object-cover" />}
        </div>
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-xs text-muted-foreground font-mono-data">{metric ?? 0} {label}</div>
        </div>
      </Link>
    </div>
  );
}
