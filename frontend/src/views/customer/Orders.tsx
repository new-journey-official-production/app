import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import CustomerShell from "./CustomerShell";
import { api, apiError } from "@/lib/api";
import type { ApiRow } from "@/types";
import { formatCurrency } from "@/lib/constants";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";

/** Orders the customer may delete (not yet in production). */
const DELETABLE_STATUSES = new Set(["placed", "cancelled"]);

export default function CustomerOrders() {
  const [orders, setOrders] = useState<ApiRow[]>([]);

  const load = () => api.get("/orders").then((r) => setOrders(r.data));
  useEffect(() => { load(); }, []);

  const deleteOrder = async (e: React.MouseEvent, o: ApiRow) => {
    e.preventDefault();
    e.stopPropagation();
    if (!DELETABLE_STATUSES.has(o.status)) {
      toast.error("This order can no longer be deleted — contact support if needed.");
      return;
    }
    if (!window.confirm(`Delete order ${o.order_no}? This cannot be undone.`)) return;
    try {
      await api.delete(`/orders/${o.id}`);
      toast.success("Order deleted");
      load();
    } catch (err) { toast.error(apiError(err)); }
  };

  return (
    <CustomerShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Your orders</h1>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">You haven't placed any orders yet.</div>
      ) : (
        <div className="mt-6 space-y-3" data-testid="my-orders-list">
          {orders.map((o) => (
            <div key={o.id} className="relative rounded-2xl border border-border p-4 hover:shadow-lg transition">
              <Link to={`/account/orders/${o.id}`} className="block" data-testid={`order-${o.order_no}`}>
                <div className="flex items-center justify-between gap-4 flex-wrap pr-10">
                  <div>
                    <div className="font-mono-data font-semibold">{o.order_no}</div>
                    <div className="text-xs text-muted-foreground">Placed on {o.created_at?.slice(0, 10)} · {o.items.length} item{o.items.length > 1 ? "s" : ""}</div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusBadge status={o.status} />
                    <div className="font-mono-data font-bold">{formatCurrency(o.total)}</div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                  {o.items.slice(0, 5).map((it, i) => (
                    <div key={i} className="h-14 w-14 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-none">
                      {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                  ))}
                </div>
              </Link>
              {DELETABLE_STATUSES.has(o.status) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive"
                  title="Delete order"
                  onClick={(e) => deleteOrder(e, o)}
                  data-testid={`delete-order-${o.order_no}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </CustomerShell>
  );
}
