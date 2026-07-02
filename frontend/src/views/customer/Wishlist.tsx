import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import CustomerShell from "./CustomerShell";
import ProductCard from "@/components/ProductCard";
import { api, apiError } from "@/lib/api";
import type { ApiRow, Product } from "@/types";
import { Button } from "@/components/ui/button";

export default function CustomerWishlist() {
  const [items, setItems] = useState<ApiRow[]>([]);
  const load = () => api.get("/wishlist").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const remove = async (pid) => {
    try { await api.delete(`/wishlist/${pid}`); load(); toast.success("Removed"); }
    catch (e) { toast.error(apiError(e)); }
  };

  return (
    <CustomerShell>
      <h1 className="font-display text-3xl font-bold tracking-tight">Wishlist</h1>
      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border p-16 text-center text-muted-foreground">Save designs you love — they'll show up here.</div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard product={p as Product} />
              <Button size="icon" variant="destructive" onClick={() => remove(p.id)} className="absolute top-2 right-2 h-8 w-8" data-testid={`wishlist-remove-${p.slug}`}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </CustomerShell>
  );
}
