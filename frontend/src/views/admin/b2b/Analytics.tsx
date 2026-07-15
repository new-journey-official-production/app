import React, { useEffect, useState } from "react";
import { Eye, Download, MessageSquareQuote, Share2 } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { Button } from "@/components/ui/button";

const PIE_COLORS = ["hsl(22 92% 52%)", "hsl(221 83% 53%)", "hsl(142 71% 45%)", "hsl(280 65% 60%)", "hsl(0 72% 51%)"];

export default function B2bAnalytics() {
  const [s, setS] = useState<ApiRow | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError("");
    api.get("/admin/b2b/analytics")
      .then((r) => setS(r.data))
      .catch((err) => {
        setS(null);
        setError(apiError(err));
        toast.error(apiError(err));
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="p-8"><div className="h-96 rounded-xl shimmer" /></div>;

  if (error || !s) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="font-display text-3xl font-bold tracking-tight mb-2">B2B Analytics</h1>
        <div className="rounded-xl border border-border bg-card p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">{error || "Could not load analytics"}</p>
          <Button variant="outline" onClick={load}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold tracking-tight">B2B Analytics</h1>
        <div className="text-sm text-muted-foreground">Catalog engagement and conversion metrics</div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Kpi icon={Eye} label="Views" value={s.views} />
        <Kpi icon={Download} label="Downloads" value={s.downloads} />
        <Kpi icon={MessageSquareQuote} label="Quotes" value={s.quotes} />
        <Kpi icon={Share2} label="Shares" value={s.shares} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Quote conversion</div>
          <div className="font-mono-data text-3xl font-bold text-orange-600">{s.quote_conversion_rate}%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Download conversion</div>
          <div className="font-mono-data text-3xl font-bold">{s.download_conversion_rate}%</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <SeriesChart title="Views · 30 days" data={s.views_series} />
        <SeriesChart title="Downloads · 30 days" data={s.downloads_series} color="hsl(142 71% 45%)" />
        <SeriesChart title="Quotes · 30 days" data={s.quotes_series} color="hsl(221 83% 53%)" />
        <BarPanel title="Top categories" data={s.top_categories} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <BarPanel title="Most viewed products" data={s.top_products} />
        <BarPanel title="Most downloaded" data={s.most_downloaded} />
        <PiePanel title="Device breakdown" data={s.devices} nameKey="device" />
        <PiePanel title="Countries" data={s.countries} nameKey="country" />
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 font-mono-data text-2xl font-bold">{value ?? 0}</div>
    </div>
  );
}

function SeriesChart({ title, data, color = "hsl(22 92% 52%)" }: { title: string; data: ApiRow[]; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-display font-semibold mb-4">{title}</div>
      <div className="h-56">
        <ResponsiveContainer>
          <LineChart data={data || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => String(d).slice(5)} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BarPanel({ title, data }: { title: string; data: ApiRow[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-display font-semibold mb-4">{title}</div>
      <div className="h-56">
        <ResponsiveContainer>
          <BarChart data={data || []} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
            <Bar dataKey="count" fill="hsl(22 92% 52%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PiePanel({ title, data, nameKey }: { title: string; data: ApiRow[]; nameKey: string }) {
  const chartData = (data || []).map((d) => ({ name: d[nameKey] || "Unknown", value: d.count }));
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="font-display font-semibold mb-4">{title}</div>
      <div className="h-56">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
              {chartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
