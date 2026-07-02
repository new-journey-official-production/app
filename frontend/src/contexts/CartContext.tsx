import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import type { CartItem, CartTotals, Product } from "@/types";

interface CartContextValue {
  items: CartItem[];
  add: (product: Product, quantity?: number, variant?: string | null) => void;
  remove: (product_id: string, variant?: string | null) => void;
  update: (product_id: string, quantity: number, variant?: string | null) => void;
  clear: () => void;
  totals: CartTotals;
}

const CartCtx = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pf-cart-v1";

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as CartItem[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product: Product, quantity = 1, variant: string | null = null): void => {
    setItems((prev) => {
      const idx = prev.findIndex((x) => x.product_id === product.id && x.variant === variant);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + quantity };
        return copy;
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          image: (product.images || [])[0],
          price: product.discount_price || product.price,
          quantity,
          variant,
          material: product.material,
        },
      ];
    });
  };

  const remove = (product_id: string, variant: string | null = null): void => {
    setItems((prev) => prev.filter((x) => !(x.product_id === product_id && x.variant === variant)));
  };

  const update = (product_id: string, quantity: number, variant: string | null = null): void => {
    setItems((prev) =>
      prev.map((x) =>
        x.product_id === product_id && x.variant === variant
          ? { ...x, quantity: Math.max(1, quantity) }
          : x,
      ),
    );
  };

  const clear = (): void => setItems([]);

  const totals = useMemo((): CartTotals => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal >= 999 || subtotal === 0 ? 0 : 79;
    const gst = subtotal * 0.18;
    const total = subtotal + shipping + gst;
    return { subtotal, shipping, gst, total, count: items.reduce((s, i) => s + i.quantity, 0) };
  }, [items]);

  return (
    <CartCtx.Provider value={{ items, add, remove, update, clear, totals }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartCtx);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
