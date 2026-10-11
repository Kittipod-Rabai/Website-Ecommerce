import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { formatBaht } from "@/lib/money";
import { parseJson, cn } from "@/lib/utils";
import { ClearCart } from "@/components/store/ClearCart";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "สถานะออเดอร์" };
export const dynamic = "force-dynamic";

const STEPS = [
  { key: "PAID", label: "ชำระเงินแล้ว" },
  { key: "PREPARING", label: "กำลังจัดช่อ" },
  { key: "OUT_FOR_DELIVERY", label: "กำลังจัดส่ง" },
  { key: "DELIVERED", label: "ส่งถึงแล้ว" },
];

const STATUS_TEXT: Record<string, string> = {
  PENDING_PAYMENT: "รอการชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PREPARING: "กำลังจัดช่อ",
  OUT_FOR_DELIVERY: "กำลังจัดส่ง",
  DELIVERED: "ส่งถึงแล้ว",
  CANCELLED: "ยกเลิกแล้ว",
  REFUNDED: "คืนเงินแล้ว",
};

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const order = await db.order.findUnique({
    where: { number },
    include: { items: true, deliverySlot: true },
  });
  if (!order) notFound();

  // Public by order number, so only non-sensitive details are shown (no phone/address).
  const stepIndex = STEPS.findIndex((s) => s.key === order.status);
  const dead = order.status === "CANCELLED" || order.status === "REFUNDED";
  const paid = !dead && order.status !== "PENDING_PAYMENT";
  const date = new Date(`${order.deliveryDate}T00:00:00Z`).toLocaleDateString("th-TH", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container-x pb-28 pt-32">
      {paid && <ClearCart />}
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          {paid ? (
            <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white">
              <Check size={26} />
            </span>
          ) : null}
          <p className="eyebrow mb-3 text-accent">ออเดอร์ {order.number}</p>
          <h1 className="display text-5xl lg:text-6xl">
            {paid ? "ขอบคุณสำหรับออเดอร์" : dead ? "ออเดอร์ถูกยกเลิก" : "รอการชำระเงิน"}
          </h1>
          <p className="mt-4 text-muted">สถานะ: {STATUS_TEXT[order.status]}</p>
        </div>

        {paid && !dead && (
          <ol className="mt-14 grid grid-cols-4 gap-2" aria-label="ความคืบหน้า">
            {STEPS.map((s, i) => (
              <li key={s.key} className="text-center">
                <div className={cn("mb-3 h-1", i <= stepIndex ? "bg-accent" : "bg-[var(--line)]")} />
                <span className={cn("text-xs", i <= stepIndex ? "font-semibold" : "text-muted")}>{s.label}</span>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-14 grid gap-8 border-y border-[var(--line)] py-10 sm:grid-cols-2">
          <div>
            <p className="eyebrow mb-2 text-muted">กำหนดจัดส่ง</p>
            <p className="display text-2xl">{date}</p>
            <p className="text-sm text-muted">ช่วง {order.deliverySlot.label}</p>
          </div>
          <div>
            <p className="eyebrow mb-2 text-muted">ผู้รับ</p>
            <p className="display text-2xl">{order.recipientName}</p>
          </div>
        </div>

        <ul className="divide-y divide-[var(--line)]">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between py-4 text-sm">
              <span>
                {i.nameSnapshot} × {i.qty}
                {parseJson<{ name: string }[]>(i.addOns, []).map((a) => (
                  <span key={a.name} className="block text-xs text-muted">+ {a.name}</span>
                ))}
              </span>
              <span className="tabular-nums">{formatBaht(i.priceSnapshot * i.qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-[var(--line)] pt-4 text-sm">
          <div className="flex justify-between"><dt>ค่าจัดส่ง</dt><dd className="tabular-nums">{order.deliveryFee === 0 ? "ฟรี" : formatBaht(order.deliveryFee)}</dd></div>
          <div className="flex items-baseline justify-between"><dt className="eyebrow">ยอดรวม</dt><dd className="display text-3xl tabular-nums">{formatBaht(order.total)}</dd></div>
        </dl>

        <div className="mt-12 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/flowers" variant="outline">เลือกช่อเพิ่ม</ButtonLink>
          <Link href="/track" className="inline-flex items-center px-4 text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4">
            ติดตามออเดอร์อื่น
          </Link>
        </div>
      </div>
    </div>
  );
}
