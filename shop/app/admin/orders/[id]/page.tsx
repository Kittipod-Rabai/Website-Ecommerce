import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { cancelOrder } from "@/lib/orders";
import { formatBaht } from "@/lib/money";
import { NEXT_STATUSES, STATUS_LABEL, thaiDate } from "@/lib/status";
import { parseJson } from "@/lib/utils";
import { Card, PageHeader, StatusBadge, adminInput, smallBtn, smallBtnOutline } from "@/components/admin/ui";

export const metadata: Metadata = { title: "รายละเอียดออเดอร์" };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true, deliverySlot: true, user: true } });
  if (!order) notFound();

  const addr = parseJson<{ line1: string; district: string; province: string; postcode: string }>(order.deliveryAddress, {
    line1: "", district: "", province: "", postcode: "",
  });
  const nexts = NEXT_STATUSES[order.status] ?? [];

  async function changeStatus(formData: FormData) {
    "use server";
    await requireAdmin(); // server actions are public endpoints: always re-check
    const to = String(formData.get("status"));
    const current = await db.order.findUnique({ where: { id } });
    if (!current || !(NEXT_STATUSES[current.status] ?? []).includes(to)) return;
    if (to === "CANCELLED") {
      await cancelOrder(id);
    } else {
      await db.order.update({ where: { id }, data: { status: to as never } });
    }
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
  }

  async function saveNote(formData: FormData) {
    "use server";
    await requireAdmin();
    await db.order.update({ where: { id }, data: { trackingNote: String(formData.get("note") ?? "").slice(0, 500) } });
    revalidatePath(`/admin/orders/${id}`);
  }

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-block text-xs text-muted underline-offset-4 hover:underline">← ออเดอร์ทั้งหมด</Link>
      <PageHeader title={`ออเดอร์ ${order.number}`} sub={`สั่งเมื่อ ${order.createdAt.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`}>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <Link href={`/admin/orders/${id}/print`} target="_blank" className={smallBtnOutline}>พิมพ์ใบจัดส่ง/การ์ด</Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card title="รายการสินค้า">
            <ul className="divide-y divide-[var(--line)] text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between py-3">
                  <span>
                    {i.nameSnapshot} × {i.qty}
                    {parseJson<{ name: string; priceSatang: number }[]>(i.addOns, []).map((a) => (
                      <span key={a.name} className="block text-xs text-muted">+ {a.name} ({formatBaht(a.priceSatang)})</span>
                    ))}
                  </span>
                  <span className="tabular-nums">{formatBaht(i.priceSnapshot * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-[var(--line)] pt-4 text-sm">
              <div className="flex justify-between"><dt>ยอดสินค้า</dt><dd className="tabular-nums">{formatBaht(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt>ค่าจัดส่ง</dt><dd className="tabular-nums">{formatBaht(order.deliveryFee)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>รวม</dt><dd className="tabular-nums">{formatBaht(order.total)}</dd></div>
            </dl>
          </Card>

          <Card title="การ์ดข้อความ">
            {order.giftMessage ? (
              <blockquote className="display border-l-2 border-accent pl-4 text-xl italic">{order.giftMessage}</blockquote>
            ) : (
              <p className="text-sm text-muted">ไม่มีข้อความ</p>
            )}
            <p className="mt-3 text-sm text-muted">
              จาก: {order.anonymous ? "ไม่ออกนาม" : order.senderName || "—"}
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="จัดส่ง">
            <p className="display text-2xl">{thaiDate(order.deliveryDate, true)}</p>
            <p className="text-sm text-muted">ช่วง {order.deliverySlot.label}</p>
            <div className="mt-5 space-y-1 text-sm">
              <p className="font-semibold">{order.recipientName}</p>
              <p><a href={`tel:${order.recipientPhone}`} className="underline">{order.recipientPhone}</a></p>
              <p className="text-muted">{addr.line1} {addr.district} {addr.province} {addr.postcode}</p>
            </div>
          </Card>

          <Card title="ผู้สั่ง">
            <p className="text-sm">{order.user?.name ?? "ลูกค้า (guest)"}</p>
            <p className="text-sm text-muted">{order.buyerEmail}</p>
            <p className="text-sm text-muted">{order.buyerPhone}</p>
          </Card>

          <Card title="จัดการสถานะ">
            {nexts.length === 0 ? (
              <p className="text-sm text-muted">ออเดอร์นี้อยู่ในสถานะสุดท้ายแล้ว</p>
            ) : (
              <form action={changeStatus} className="flex flex-wrap gap-2">
                {nexts.map((s) => (
                  <button key={s} name="status" value={s} className={s === "CANCELLED" || s === "REFUNDED" ? smallBtnOutline : smallBtn}>
                    → {STATUS_LABEL[s]}
                  </button>
                ))}
              </form>
            )}
            {nexts.includes("CANCELLED") && <p className="mt-3 text-xs text-muted">การยกเลิกจะคืนคิวของวันจัดส่งอัตโนมัติ (การคืนเงินจริงทำใน Stripe Dashboard)</p>}
            <form action={saveNote} className="mt-5 space-y-2">
              <label className="eyebrow block text-[0.65rem] text-muted" htmlFor="note">บันทึกภายใน / เลขพัสดุ / ชื่อไรเดอร์</label>
              <input id="note" name="note" defaultValue={order.trackingNote} className={adminInput} />
              <button className={smallBtnOutline}>บันทึก</button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
