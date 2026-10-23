import type { Metadata } from "next";
import { db } from "@/lib/db";
import { formatBaht } from "@/lib/money";
import { REVENUE_STATUSES } from "@/lib/admin-stats";
import { PageHeader, adminInput, smallBtn } from "@/components/admin/ui";

export const metadata: Metadata = { title: "ลูกค้า" };

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = q?.trim();
  const users = await db.user.findMany({
    where: { role: "CUSTOMER", ...(term ? { OR: [{ email: { contains: term.toLowerCase() } }, { name: { contains: term } }] } : {}) },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { orders: { where: { status: { in: [...REVENUE_STATUSES] } }, select: { total: true } } },
  });

  return (
    <>
      <PageHeader title="ลูกค้า" sub={`สมาชิก ${users.length} คน (ดูอย่างเดียว)`} />
      <form className="mb-6 flex max-w-md gap-2">
        <input name="q" defaultValue={term} placeholder="ค้นหาชื่อหรืออีเมล" aria-label="ค้นหา" className={adminInput} />
        <button className={smallBtn}>ค้นหา</button>
      </form>
      <div className="overflow-x-auto rounded-3xl border border-[var(--line)] bg-snow">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-xs text-muted">
            <tr>
              <th className="p-4 font-medium">ชื่อ</th>
              <th className="font-medium">อีเมล</th>
              <th className="font-medium">สมัครเมื่อ</th>
              <th className="text-right font-medium">ออเดอร์</th>
              <th className="p-4 text-right font-medium">ยอดซื้อรวม</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-4 font-medium">{u.name ?? "—"}</td>
                <td>{u.email}</td>
                <td>{u.createdAt.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok" })}</td>
                <td className="text-right tabular-nums">{u.orders.length}</td>
                <td className="p-4 text-right tabular-nums">{formatBaht(u.orders.reduce((s, o) => s + o.total, 0))}</td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted">ไม่พบลูกค้า</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
