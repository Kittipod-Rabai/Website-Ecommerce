"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatBaht } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart } from "./CartProvider";

type V = { id: string; label: string; priceSatang: number };
type A = { id: string; name: string; priceSatang: number };

const SIZE_HINT: Record<string, string> = { S: "กะทัดรัด", M: "ยอดนิยม", L: "อลังการ" };

export function ProductPurchase({
  product,
  variants,
  addOns,
}: {
  product: { slug: string; name: string; image: string };
  variants: V[];
  addOns: A[];
}) {
  const { add } = useCart();
  const [variantId, setVariantId] = useState(variants[Math.min(1, variants.length - 1)].id);
  const [selected, setSelected] = useState<string[]>([]);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId)!;
  const chosen = addOns.filter((a) => selected.includes(a.id));
  const total = variant.priceSatang + chosen.reduce((s, a) => s + a.priceSatang, 0);

  function onAdd() {
    add({
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      label: variant.label,
      priceSatang: variant.priceSatang,
      image: product.image,
      addOns: chosen,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="space-y-9">
      <div>
        <p className="eyebrow mb-3 text-muted">เลือกขนาด</p>
        <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="ขนาด">
          {variants.map((v) => (
            <button
              key={v.id}
              role="radio"
              aria-checked={v.id === variantId}
              onClick={() => setVariantId(v.id)}
              className={cn(
                "rounded-2xl border px-3 py-4 text-left transition-colors",
                v.id === variantId ? "border-ink bg-ink text-snow" : "border-[var(--line)] hover:border-ink",
              )}
            >
              <span className="display block text-2xl">{v.label}</span>
              <span className="mt-1 block text-[0.7rem] opacity-60">{SIZE_HINT[v.label] ?? ""}</span>
              <span className="mt-2 block text-sm tabular-nums">{formatBaht(v.priceSatang)}</span>
            </button>
          ))}
        </div>
      </div>

      {addOns.length > 0 && (
        <div>
          <p className="eyebrow mb-3 text-muted">เพิ่มของขวัญ (ไม่บังคับ)</p>
          <ul className="space-y-2">
            {addOns.map((a) => {
              const on = selected.includes(a.id);
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setSelected((s) => (on ? s.filter((x) => x !== a.id) : [...s, a.id]))}
                    aria-pressed={on}
                    className={cn(
                      "flex w-full items-center justify-between border px-4 py-3 text-sm transition-colors",
                      on ? "border-ink bg-paper-deep" : "border-[var(--line)] hover:border-ink",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn("flex h-5 w-5 items-center justify-center border", on ? "border-ink bg-ink text-snow" : "border-[var(--line)]")}>
                        {on && <Check size={13} />}
                      </span>
                      {a.name}
                    </span>
                    <span className="tabular-nums text-muted">+{formatBaht(a.priceSatang)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="border-t border-[var(--line)] pt-7">
        <div className="mb-5 flex items-baseline justify-between">
          <span className="text-sm text-muted">ราคารวม</span>
          <span className="display text-4xl tabular-nums">{formatBaht(total)}</span>
        </div>
        <Button onClick={onAdd} className="w-full py-5">
          {added ? "เพิ่มลงตะกร้าแล้ว ✓" : "ใส่ตะกร้า"}
        </Button>
        <p className="mt-4 text-center text-xs text-muted">เลือกวันและเวลาจัดส่งในขั้นตอนชำระเงิน</p>
      </div>
    </div>
  );
}
