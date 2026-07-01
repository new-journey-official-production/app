import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

const CartCtx = createContext(null);
const STORAGE_KEY = "pf-cart-v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = (product, quantity = 1, variant = null) => {
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

  const remove = (product_id, variant = null) => {
    setItems((prev) => prev.filter((x) => !(x.product_id === product_id && x.variant === variant)));
  };

  const update = (product_id, quantity, variant = null) => {
    setItems((prev) => prev.map((x) => (x.product_id === product_id && x.variant === variant ? { ...x, quantity: Math.max(1, quantity) } : x)));
  };

  const clear = () => setItems([]);

  const totals = useMemo(() => {
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

export const useCart = () => useContext(CartCtx);
