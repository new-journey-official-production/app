import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ShoppingBag, Printer, Users, AlertTriangle, IndianRupee } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";

export default function AdminDashboard() {
  const [s, setS] = useState<ApiRow | null>(null);
  useEffect(() => { api.get("/admin/analytics/summary").then((r) => setS(r.data)); }, []);
  if (!s) return <div className="p-8"><div className="h-96 rounded-2xl shimmer" /></div>;

  return (
    <div className="p-6 lg:p-8" data-testid="admin-dashboard">
      <header className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Studio overview</h1>
          <div className="text-sm text-muted-foreground">Business health at a glance</div>
        </div>
        <div className="text-xs font-mono-data text-muted-foreground">{new Date().toLocaleString()}</div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi icon={IndianRupee} label="Today revenue" value={formatCurrency(s.today_revenue)} accent />
        <Kpi icon={ShoppingBag} label="Today orders" value={s.today_orders} />
        <Kpi icon={Printer} label="Printing queue" value={s.printing_queue} />
        <Kpi icon={AlertTriangle} label="Pending orders" value={s.pending_orders} />
        <Kpi icon={TrendingUp} label="Total revenue" value={formatCurrency(s.total_revenue)} />
        <Kpi icon={ShoppingBag} label="Total orders" value={s.total_orders} />
        <Kpi icon={Users} label="Customers" value={s.customers_count} />
        <Kpi icon={IndianRupee} label="Avg order value" value={formatCurrency(s.aov)} />
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold">Revenue · last 14 days</div>
            <div className="text-xs text-muted-foreground font-mono-data">{formatCurrency(s.total_revenue)}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={s.revenue_series}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(22 92% 52%)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-display font-semibold mb-4">Top products by revenue</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={s.top_products} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                <Bar dataKey="revenue" fill="hsl(22 92% 52%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="font-display font-semibold">Recent orders</div>
            <Link to="/admin/orders" className="text-xs text-orange-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {s.recent_orders.slice(0, 6).map((o) => (
              <Link key={o.id} to={`/admin/orders/${o.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition">
                <div>
                  <div className="font-mono-data text-sm font-semibold">{o.order_no}</div>
                  <div className="text-xs text-muted-foreground">{o.user_email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <div className="font-mono-data text-sm">{formatCurrency(o.total)}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="font-display font-semibold mb-4 flex items-center gap-2 text-red-600"><AlertTriangle className="h-4 w-4" /> Low stock alerts</div>
          {s.low_stock.length === 0 ? (
            <div className="text-sm text-muted-foreground">All inventory items above reorder threshold. Nice.</div>
          ) : (
            <div className="space-y-2">
              {s.low_stock.map((i) => (
                <div key={i.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/40">
                  <div>
                    <div className="font-medium text-sm">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.material || i.kind}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-data font-semibold text-red-600">{i.quantity} {i.unit}</div>
                    <div className="text-[10px] text-muted-foreground">reorder ≤ {i.reorder_level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
      <div className="mt-2 font-mono-data text-2xl font-bold">{value}</div>
    </div>
  );
}
