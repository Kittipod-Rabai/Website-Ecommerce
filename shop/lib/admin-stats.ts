import { db } from "@/lib/db";
import { addDays, bangkokParts, BKK_OFFSET_MS } from "@/lib/delivery";
import { getSettings } from "@/lib/orders";

/** Orders that count as revenue. */
export const REVENUE_STATUSES = ["PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

/** Bangkok calendar date (YYYY-MM-DD) of a stored UTC timestamp. */
const bkkDate = (d: Date) => new Date(d.getTime() + BKK_OFFSET_MS).toISOString().slice(0, 10);

export async function getDashboardData(now = new Date()) {
  const today = bangkokParts(now).date;
  const tomorrow = addDays(today, 1);
  const monthStart = today.slice(0, 8) + "01";
  const from30 = addDays(today, -29);
  const settings = await getSettings();

  const [recentPaid, recentOrders, deliveries, caps, pendingCount] = await Promise.all([
    db.order.findMany({
      where: { status: { in: [...REVENUE_STATUSES] }, createdAt: { gte: new Date(`${from30}T00:00:00+07:00`) } },
      select: { total: true, createdAt: true },
    }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { deliverySlot: true } }),
    db.order.findMany({
      where: { deliveryDate: { in: [today, tomorrow] }, status: { in: ["PAID", "PREPARING", "OUT_FOR_DELIVERY"] } },
      include: { deliverySlot: true, items: true },
      orderBy: [{ deliveryDate: "asc" }, { deliverySlot: { startTime: "asc" } }],
    }),
    db.dailyCapacity.findMany({ where: { date: { gte: today, lte: addDays(today, 7) } } }),
    db.order.count({ where: { status: "PENDING_PAYMENT" } }),
  ]);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < 30; i++) byDay.set(addDays(from30, i), { revenue: 0, orders: 0 });
  for (const o of recentPaid) {
    const row = byDay.get(bkkDate(o.createdAt));
    if (row) {
      row.revenue += o.total;
      row.orders += 1;
    }
  }
  const series = [...byDay.entries()].map(([date, v]) => ({ date, revenue: v.revenue / 100, orders: v.orders }));

  const sum = (from: string) =>
    recentPaid.filter((o) => bkkDate(o.createdAt) >= from).reduce((s, o) => s + o.total, 0);
  const count = (from: string) => recentPaid.filter((o) => bkkDate(o.createdAt) >= from).length;
  const month = { revenue: 0, orders: 0 };
  // The month may start before the 30-day window, so query it directly.
  const monthAgg = await db.order.aggregate({
    where: { status: { in: [...REVENUE_STATUSES] }, createdAt: { gte: new Date(`${monthStart}T00:00:00+07:00`) } },
    _sum: { total: true },
    _count: true,
  });
  month.revenue = monthAgg._sum.total ?? 0;
  month.orders = monthAgg._count;

  const capAlerts = [] as { date: string; remaining: number; closed: boolean }[];
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    const c = caps.find((x) => x.date === date);
    const max = c?.maxOrders ?? settings.defaultCapacity;
    const remaining = max - (c?.usedOrders ?? 0);
    if (c?.closed || remaining <= settings.lowCapacityThreshold) capAlerts.push({ date, remaining, closed: !!c?.closed });
  }

  return {
    today,
    tomorrow,
    kpis: {
      todayRevenue: sum(today),
      todayOrders: count(today),
      monthRevenue: month.revenue,
      monthOrders: month.orders,
      toDeliverToday: deliveries.filter((d) => d.deliveryDate === today).length,
      toDeliverTomorrow: deliveries.filter((d) => d.deliveryDate === tomorrow).length,
      pendingPayment: pendingCount,
    },
    series,
    recentOrders,
    deliveries,
    capAlerts,
  };
}
