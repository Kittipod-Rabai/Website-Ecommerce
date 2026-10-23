import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { addDays, bangkokParts } from "@/lib/delivery";
import { getSettings } from "@/lib/orders";
import { thaiDate } from "@/lib/status";
import { cn } from "@/lib/utils";
import { PageHeader, StatusBadge, smallBtnOutline } from "@/components/admin/ui";

export const metadata: Metadata = { title: "ปฏิทินจัดส่ง" };

const DAY = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

/** Monday of the week containing `ymd`. */
function weekStart(ymd: string) {
  const d = new Date(`${ymd}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(ymd, -dow);
}

export default async function AdminCalendar({ searchParams }: { searchParams: Promise<{ start?: string }> }) {
  const sp = await searchParams;
  const today = bangkokParts(new Date()).date;
  const start = weekStart(/^\d{4}-\d{2}-\d{2}$/.test(sp.start ?? "") ? sp.start! : today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const [slots, orders, caps, settings] = await Promise.all([
    db.deliverySlot.findMany({ orderBy: { startTime: "asc" } }),
    db.order.findMany({
      where: { deliveryDate: { gte: days[0], lte: days[6] }, status: { in: ["PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "PENDING_PAYMENT"] } },
      include: { items: true },
    }),
    db.dailyCapacity.findMany({ where: { date: { gte: days[0], lte: days[6] } } }),
    getSettings(),
  ]);

  return (
    <>
      <PageHeader title="ปฏิทินจัดส่ง" sub={`${thaiDate(days[0])} – ${thaiDate(days[6])}`}>
        <div className="flex gap-2">
          <Link href={`/admin/calendar?start=${addDays(start, -7)}`} className={smallBtnOutline}>← สัปดาห์ก่อน</Link>
          <Link href="/admin/calendar" className={smallBtnOutline}>สัปดาห์นี้</Link>
          <Link href={`/admin/calendar?start=${addDays(start, 7)}`} className={smallBtnOutline}>สัปดาห์ถัดไป →</Link>
        </div>
      </PageHeader>

      <div className="overflow-x-auto">
        <div className="grid min-w-[980px] grid-cols-7 gap-px overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--line)]">
          {days.map((date) => {
            const cap = caps.find((c) => c.date === date);
            const max = cap?.maxOrders ?? settings.defaultCapacity;
            const used = cap?.usedOrders ?? 0;
            const dt = new Date(`${date}T00:00:00Z`);
            const isToday = date === today;
            return (
              <div key={date} className={cn("min-h-[420px] bg-snow/80", isToday && "bg-[#fbf7f1]")}>
                <div className={cn("border-b border-[var(--line)] p-3", isToday && "bg-ink text-snow")}>
                  <p className="text-xs opacity-60">{DAY[dt.getUTCDay()]}</p>
                  <p className="display text-3xl leading-none">{dt.getUTCDate()}</p>
                  <p className="mt-1 text-[0.7rem] opacity-70">
                    {cap?.closed ? "ปิดรับ" : `คิว ${used}/${max}`}
                  </p>
                </div>
                {slots.map((s) => {
                  const cell = orders.filter((o) => o.deliveryDate === date && o.deliverySlotId === s.id);
                  return (
                    <div key={s.id} className="border-b border-[var(--line)] p-2 last:border-b-0">
                      <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted">{s.startTime}–{s.endTime}</p>
                      <ul className="space-y-1.5">
                        {cell.map((o) => (
                          <li key={o.id}>
                            <Link href={`/admin/orders/${o.id}`} className="block border border-[var(--line)] bg-snow p-2 text-xs transition-colors hover:border-ink">
                              <span className="font-semibold">{o.recipientName}</span>
                              <span className="block truncate text-muted">{o.items.map((i) => i.nameSnapshot).join(", ")}</span>
                              <span className="mt-1 block"><StatusBadge status={o.status} /></span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
