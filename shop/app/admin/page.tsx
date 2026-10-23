import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getDashboardData } from "@/lib/admin-stats";
import { expireStaleOrders } from "@/lib/orders";
import { formatBaht } from "@/lib/money";
import { thaiDate } from "@/lib/status";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/RevenueChart";

export default async function AdminDashboard() {
  await expireStaleOrders();
  const d = await getDashboardData();
  const k = d.kpis;

  const tiles = [
    { label: "ยอดขายวันนี้", value: formatBaht(k.todayRevenue), sub: `${k.todayOrders} ออเดอร์` },
    { label: "ยอดขายเดือนนี้", value: formatBaht(k.monthRevenue), sub: `${k.monthOrders} ออเดอร์` },
    { label: "ต้องส่งวันนี้", value: String(k.toDeliverToday), sub: "ออเดอร์", href: "/admin/calendar" },
    { label: "ต้องส่งพรุ่งนี้", value: String(k.toDeliverTomorrow), sub: "ออเดอร์", href: "/admin/calendar" },
  ];

  return (
    <>
      <PageHeader title="ภาพรวม" sub={`วันนี้ ${thaiDate(d.today, true)}`} />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((t) => {
          const body = (
            <div className="h-full rounded-3xl border border-[var(--line)] bg-snow p-5">
              <p className="eyebrow text-[0.65rem] text-muted">{t.label}</p>
              <p className="display mt-3 text-4xl tabular-nums lg:text-5xl">{t.value}</p>
              <p className="mt-1 text-xs text-muted">{t.sub}</p>
            </div>
          );
          return t.href ? (
            <Link key={t.label} href={t.href} className="block transition-colors hover:[&>div]:border-accent">
              {body}
            </Link>
          ) : (
            <div key={t.label}>{body}</div>
          );
        })}
      </div>

      {(d.capAlerts.length > 0 || k.pendingPayment > 0) && (
        <div className="mt-6 space-y-2">
          {d.capAlerts.map((a) => (
            <div key={a.date} className="flex items-center gap-3 border border-[#e0b04a] bg-[#fbf3dc] px-4 py-3 text-sm text-[#6b5516]">
              <AlertTriangle size={16} />
              <span>
                {thaiDate(a.date, true)}: {a.closed ? "ปิดรับออเดอร์" : a.remaining <= 0 ? "คิวเต็มแล้ว" : `เหลือคิวอีก ${a.remaining} ออเดอร์`}
              </span>
              <Link href="/admin/capacity" className="ml-auto text-xs underline">จัดการคิว</Link>
            </div>
          ))}
          {k.pendingPayment > 0 && (
            <p className="px-1 text-xs text-muted">มี {k.pendingPayment} ออเดอร์รอชำระเงิน (ยกเลิกอัตโนมัติและคืนคิวหลัง 30 นาที)</p>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="รายได้ 30 วันล่าสุด">
          <RevenueChart data={d.series} />
        </Card>

        <Card title="ต้องจัดส่ง" action={<Link href="/admin/calendar" className="text-xs underline">ดูปฏิทิน</Link>}>
          {d.deliveries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">ไม่มีออเดอร์ที่ต้องส่งวันนี้หรือพรุ่งนี้</p>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {d.deliveries.slice(0, 8).map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 text-sm hover:opacity-70">
                    <div>
                      <p className="font-semibold">{o.deliveryDate === d.today ? "วันนี้" : "พรุ่งนี้"} · {o.deliverySlot.label}</p>
                      <p className="text-xs text-muted">{o.recipientName} · {o.items.map((i) => i.nameSnapshot).join(", ")}</p>
                    </div>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="ออเดอร์ล่าสุด" className="mt-6" action={<Link href="/admin/orders" className="text-xs underline">ทั้งหมด</Link>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-3 font-medium">เลขที่</th>
                <th className="pb-3 font-medium">ผู้รับ</th>
                <th className="pb-3 font-medium">ส่งวันที่</th>
                <th className="pb-3 font-medium">สถานะ</th>
                <th className="pb-3 text-right font-medium">ยอดรวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {d.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-paper-deep/50">
                  <td className="py-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold underline-offset-4 hover:underline">{o.number}</Link></td>
                  <td>{o.recipientName}</td>
                  <td>{thaiDate(o.deliveryDate)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-right tabular-nums">{formatBaht(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
