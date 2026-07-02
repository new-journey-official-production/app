import React, { useEffect, useState } from "react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { api } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";

const COLORS = ["hsl(22 92% 52%)", "hsl(217 91% 60%)", "hsl(160 84% 39%)", "hsl(43 96% 56%)", "hsl(271 91% 65%)", "hsl(340 82% 52%)", "hsl(190 90% 50%)", "hsl(30 90% 50%)"];

export default function AdminAnalytics() {
  const [s, setS] = useState<ApiRow | null>(null);
  useEffect(() => { api.get("/admin/analytics/summary").then((r) => setS(r.data)); }, []);
  if (!s) return <div className="p-8"><div className="h-96 rounded-2xl shimmer" /></div>;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Total revenue" v={formatCurrency(s.total_revenue)} />
        <Kpi label="Total orders" v={s.total_orders} />
        <Kpi label="Average order value" v={formatCurrency(s.aov)} />
        <Kpi label="Customers" v={s.customers_count} />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="font-display font-semibold mb-4">Revenue trend</div>
        <div className="h-72">
          <ResponsiveContainer>
            <AreaChart data={s.revenue_series}>
              <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(22 92% 52%)" stopOpacity={0.4} /><stop offset="100%" stopColor="hsl(22 92% 52%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              <Area dataKey="revenue" stroke="hsl(22 92% 52%)" strokeWidth={2} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-display font-semibold mb-4">Top products by revenue</div>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={s.top_products} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${String(e.name ?? "").slice(0, 12)} ${(((e.percent ?? 0) as number) * 100).toFixed(0)}%`}>
                  {s.top_products.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-display font-semibold mb-4">Product breakdown</div>
          <div className="space-y-2">
            {s.top_products.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-3 rounded-lg bg-accent">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="font-medium text-sm truncate">{p.name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground font-mono-data">{p.count} sold</div>
                  <div className="font-mono-data text-sm font-semibold">{formatCurrency(p.revenue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, v }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono-data text-2xl font-bold">{v}</div>
    </div>
  );
}
