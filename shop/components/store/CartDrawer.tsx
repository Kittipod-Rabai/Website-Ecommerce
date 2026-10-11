"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { useEffect } from "react";
import { FlowerArt } from "./FlowerArt";
import { lineTotal, useCart } from "./CartProvider";
import { formatBaht } from "@/lib/money";
import { ButtonLink } from "@/components/ui/Button";

export function CartDrawer() {
  const { open, setOpen, lines, subtotal, setQty, remove } = useCart();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[60] bg-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="ตะกร้าสินค้า"
            className="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[440px] flex-col bg-paper text-ink"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-6 py-5">
              <h2 className="display text-2xl">ตะกร้าของคุณ</h2>
              <button onClick={() => setOpen(false)} aria-label="ปิดตะกร้า" className="p-1 hover:opacity-60">
                <X size={22} />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
                <p className="display text-3xl">ตะกร้ายังว่างอยู่</p>
                <p className="text-sm text-muted">เลือกช่อดอกไม้ที่ใช่ แล้วส่งความรู้สึกถึงคนพิเศษ</p>
                <ButtonLink href="/flowers" variant="solid">
                  เลือกช่อดอกไม้
                </ButtonLink>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-[var(--line)] overflow-y-auto px-6">
                  {lines.map((l) => (
                    <li key={l.key} className="flex gap-4 py-5">
                      <Link
                        href={`/flowers/${l.slug}`}
                        onClick={() => setOpen(false)}
                        className="h-28 w-[88px] shrink-0 overflow-hidden"
                      >
                        <FlowerArt seed={l.slug} palette={l.palette} />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <div className="flex justify-between gap-2">
                          <div>
                            <p className="display text-xl leading-tight">{l.name}</p>
                            <p className="mt-1 text-xs text-muted">ขนาด {l.label}</p>
                            {l.addOns.map((a) => (
                              <p key={a.id} className="text-xs text-muted">
                                + {a.name}
                              </p>
                            ))}
                          </div>
                          <button
                            onClick={() => remove(l.key)}
                            aria-label={`ลบ ${l.name}`}
                            className="h-fit p-1 text-muted hover:text-ink"
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center border border-[var(--line)]">
                            <button onClick={() => setQty(l.key, l.qty - 1)} aria-label="ลดจำนวน" className="p-2 hover:bg-paper-deep">
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums">{l.qty}</span>
                            <button onClick={() => setQty(l.key, l.qty + 1)} aria-label="เพิ่มจำนวน" className="p-2 hover:bg-paper-deep">
                              <Plus size={14} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">{formatBaht(lineTotal(l))}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="space-y-4 border-t border-[var(--line)] px-6 py-6">
                  <div className="flex justify-between text-sm">
                    <span>ยอดรวมสินค้า</span>
                    <span className="font-semibold tabular-nums">{formatBaht(subtotal)}</span>
                  </div>
                  <p className="text-xs text-muted">ค่าจัดส่งและวัน-เวลาส่ง เลือกในขั้นตอนชำระเงิน</p>
                  <div className="grid gap-3">
                    <ButtonLink href="/checkout" className="w-full">
                      ชำระเงิน
                    </ButtonLink>
                    <Link
                      href="/cart"
                      onClick={() => setOpen(false)}
                      className="text-center text-xs uppercase tracking-[0.14em] underline underline-offset-4"
                    >
                      ดูตะกร้าทั้งหมด
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
