"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { formatBaht } from "@/lib/money";
import Image from "next/image";
import { lineTotal, useCart } from "./CartProvider";

export function CartPageView() {
  const { lines, subtotal, setQty, remove, ready } = useCart();

  if (!ready) return <div className="h-64" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="display text-4xl">ตะกร้ายังว่างอยู่</p>
        <p className="mt-4 text-sm text-muted">เลือกช่อดอกไม้ที่ใช่ แล้วส่งความรู้สึกถึงคนพิเศษ</p>
        <div className="mt-8">
          <ButtonLink href="/flowers">เลือกช่อดอกไม้</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-14 lg:grid-cols-[1.6fr_1fr] lg:gap-20">
      <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {lines.map((l) => (
          <li key={l.key} className="flex gap-5 py-6">
            <Link href={`/flowers/${l.slug}`} className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl">
              <Image src={l.image} alt={l.name} fill sizes="120px" className="object-cover" />
            </Link>
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div>
                  <Link href={`/flowers/${l.slug}`} className="display text-2xl hover:underline">
                    {l.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">ขนาด {l.label} · {formatBaht(l.priceSatang)}</p>
                  {l.addOns.map((a) => (
                    <p key={a.id} className="text-sm text-muted">+ {a.name} ({formatBaht(a.priceSatang)})</p>
                  ))}
                </div>
                <button onClick={() => remove(l.key)} aria-label={`ลบ ${l.name}`} className="h-fit p-1 text-muted hover:text-ink">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="flex items-center overflow-hidden rounded-full border border-[var(--line)]">
                  <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="ลดจำนวน" className="p-2.5 hover:bg-paper-deep">
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm tabular-nums">{l.qty}</span>
                  <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="เพิ่มจำนวน" className="p-2.5 hover:bg-paper-deep">
                    <Plus size={14} />
                  </button>
                </div>
                <span className="font-semibold tabular-nums">{formatBaht(lineTotal(l))}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit border border-[var(--line)] rounded-3xl bg-snow/50 p-7 lg:sticky lg:top-28">
        <h2 className="display mb-6 text-3xl">สรุป</h2>
        <div className="flex justify-between text-sm">
          <span>ยอดรวมสินค้า</span>
          <span className="tabular-nums">{formatBaht(subtotal)}</span>
        </div>
        <p className="mt-3 text-xs text-muted">ค่าจัดส่งคำนวณตามรหัสไปรษณีย์ในขั้นตอนถัดไป · ซื้อครบ ฿3,000 ส่งฟรี</p>
        <div className="mt-6 grid gap-3">
          <ButtonLink href="/checkout" className="w-full py-5">
            ดำเนินการชำระเงิน
          </ButtonLink>
          <Link href="/flowers" className="text-center text-xs uppercase tracking-[0.14em] underline underline-offset-4">
            เลือกช่อเพิ่ม
          </Link>
        </div>
      </aside>
    </div>
  );
}
