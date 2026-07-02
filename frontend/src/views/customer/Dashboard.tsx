import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import CustomerShell from "./CustomerShell";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import type { ApiRow } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<ApiRow[]>([]);
  const [wishlist, setWishlist] = useState<ApiRow[]>([]);
  const [notifications, setNotifications] = useState<ApiRow[]>([]);

  useEffect(() => {
    api.get("/orders").then((r) => setOrders(r.data));
    api.get("/wishlist").then((r) => setWishlist(r.data));
    api.get("/notifications").then((r) => setNotifications(r.data));
  }, []);

  const totalSpend = orders.reduce((s, o) => s + o.total, 0);

  return (
    <CustomerShell>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Hi, {user?.name?.split(" ")[0] || "there"} 👋</h1>
        <p className="mt-1 text-muted-foreground">Here's a snapshot of your activity.</p>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          <Stat icon={ShoppingBag} label="Orders" value={orders.length} />
          <Stat icon={Package} label="Lifetime spend" value={formatCurrency(totalSpend)} mono />
          <Stat icon={Heart} label="Wishlist" value={wishlist.length} />
        </div>

        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-semibold text-lg">Recent orders</div>
            <Link to="/account/orders" className="text-xs text-orange-600 hover:underline">View all →</Link>
          </div>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <div className="font-display text-lg">No orders yet</div>
              <Link to="/products" className="mt-3 inline-flex items-center gap-1 text-sm text-orange-600 hover:underline">Start browsing <ArrowRight className="h-3 w-3" /></Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              {orders.slice(0, 5).map((o) => (
                <Link key={o.id} to={`/account/orders/${o.id}`} className="flex items-center justify-between p-4 border-b last:border-b-0 border-border hover:bg-accent transition" data-testid={`order-row-${o.order_no}`}>
                  <div>
                    <div className="font-mono-data text-sm font-semibold">{o.order_no}</div>
                    <div className="text-xs text-muted-foreground">{o.items.length} item{o.items.length > 1 ? "s" : ""} · {o.created_at?.slice(0, 10)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <div className="font-mono-data font-semibold w-24 text-right">{formatCurrency(o.total)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="mt-10">
            <div className="font-display font-semibold text-lg mb-3">Notifications</div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              {notifications.slice(0, 5).map((n) => (
                <div key={n.id} className="p-4">
                  <div className="text-sm font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.message} · <span className="font-mono-data">{n.created_at?.slice(0, 16).replace("T", " ")}</span></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}

function Stat({ icon: Icon, label, value, mono = false }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className={`mt-3 text-2xl font-bold ${mono ? "font-mono-data" : "font-display"}`}>{value}</div>
    </div>
  );
}
