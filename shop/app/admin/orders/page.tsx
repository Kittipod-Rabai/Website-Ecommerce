import { contains } from "@/lib/db-flavor";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatBaht } from "@/lib/money";
import { STATUS_LABEL, thaiDate } from "@/lib/status";
import { cn } from "@/lib/utils";
import { PageHeader, StatusBadge, adminInput, smallBtn } from "@/components/admin/ui";

export const metadata: Metadata = { title: "ออเดอร์" };

const PAGE_SIZE = 20;

export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status && sp.status in STATUS_LABEL ? sp.status : undefined;
  const q = sp.q?.trim();

  const where = {
    ...(status ? { status: status as keyof typeof STATUS_LABEL as never } : {}),
    ...(q
      ? {
          OR: [
            { number: contains(q) },
            { recipientName: contains(q) },
            { buyerEmail: contains(q) },
            { buyerPhone: contains(q) },
          ],
        }
      : {}),
  };
  const [orders, total, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { deliverySlot: true } }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  const href = (patch: Record<string, string | undefined>) => {
    const qs = new URLSearchParams();
    const merged = { status, q, page: undefined as string | undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
    const s = qs.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="ออเดอร์" sub={`ทั้งหมด ${total} รายการ`} />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={href({ status: undefined })} className={cn("rounded-full border px-3.5 py-1.5 text-xs", !status ? "border-accent bg-accent text-white" : "border-[var(--line)] hover:border-ink")}>
          ทั้งหมด
        </Link>
        {Object.entries(STATUS_LABEL).map(([k, label]) => (
          <Link key={k} href={href({ status: k })} className={cn("rounded-full border px-3.5 py-1.5 text-xs", status === k ? "border-accent bg-accent text-white" : "border-[var(--line)] hover:border-ink")}>
            {label} <span className="opacity-60">{countOf(k)}</span>
          </Link>
        ))}
      </div>

      <form className="mb-6 flex max-w-lg gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <input name="q" defaultValue={q} placeholder="ค้นหาเลขออเดอร์ ชื่อผู้รับ อีเมล เบอร์โทร" className={adminInput} aria-label="ค้นหา" />
        <button className={smallBtn}>ค้นหา</button>
      </form>

      <div className="overflow-x-auto rounded-3xl border border-[var(--line)] bg-snow">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-xs text-muted">
            <tr>
              <th className="p-4 font-medium">เลขที่</th>
              <th className="font-medium">ผู้รับ</th>
              <th className="font-medium">ส่งวันที่</th>
              <th className="font-medium">ช่วงเวลา</th>
              <th className="font-medium">สถานะ</th>
              <th className="p-4 text-right font-medium">ยอดรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-paper-deep/50">
                <td className="p-4">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold underline-offset-4 hover:underline">{o.number}</Link>
                </td>
                <td>{o.recipientName}</td>
                <td>{thaiDate(o.deliveryDate)}</td>
                <td>{o.deliverySlot.label}</td>
                <td><StatusBadge status={o.status} /></td>
                <td className="p-4 text-right tabular-nums">{formatBaht(o.total)}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-muted">ไม่พบออเดอร์</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm">
          {page > 1 && <Link className="border border-[var(--line)] px-3 py-1.5 hover:border-ink" href={href({ page: String(page - 1) })}>ก่อนหน้า</Link>}
          <span className="px-3 text-muted">{page} / {pages}</span>
          {page < pages && <Link className="border border-[var(--line)] px-3 py-1.5 hover:border-ink" href={href({ page: String(page + 1) })}>ถัดไป</Link>}
        </div>
      )}
    </>
  );
}
