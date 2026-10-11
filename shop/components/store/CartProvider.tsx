"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartAddOn = { id: string; name: string; priceSatang: number };

export type CartLine = {
  key: string; // variantId + addOn ids
  variantId: string;
  slug: string;
  name: string;
  label: string;
  priceSatang: number;
  palette: string[];
  qty: number;
  addOns: CartAddOn[];
};

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "key" | "qty">, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  ready: boolean;
};

const Ctx = createContext<CartCtx | null>(null);
const STORAGE_KEY = "mf-cart-v1";

export const lineTotal = (l: CartLine) =>
  (l.priceSatang + l.addOns.reduce((s, a) => s + a.priceSatang, 0)) * l.qty;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback<CartCtx["add"]>((line, qty = 1) => {
    const key = `${line.variantId}:${line.addOns.map((a) => a.id).sort().join(",")}`;
    setLines((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: Math.min(l.qty + qty, 20) } : l));
      return [...prev, { ...line, key, qty }];
    });
    setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty: Math.min(qty, 20) } : l)),
    );
  }, []);

  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartCtx>(
    () => ({
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + lineTotal(l), 0),
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
      ready,
    }),
    [lines, open, add, setQty, remove, clear, ready],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
