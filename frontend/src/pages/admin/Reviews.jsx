import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { api, apiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function AdminReviews() {
  const [items, setItems] = useState([]);
  const load = () => api.get("/reviews").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const toggle = async (id, approved) => {
    try { await api.patch(`/reviews/${id}`, { approved }); load(); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <div className="p-6 lg:p-8">
      <h1 className="font-display text-3xl font-bold tracking-tight">Reviews</h1>
      <div className="text-sm text-muted-foreground mb-6">{items.length} customer reviews</div>
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="font-semibold">{r.user_name}</div>
                <div className="text-xs text-muted-foreground">{r.title}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}</div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.approved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800"}`}>{r.approved ? "Approved" : "Pending"}</span>
                <Button size="sm" variant="outline" onClick={() => toggle(r.id, !r.approved)}>{r.approved ? "Unapprove" : "Approve"}</Button>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{r.comment}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
