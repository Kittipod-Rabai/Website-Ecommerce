import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import { thaiDate } from "@/lib/status";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata = { title: "พิมพ์ใบจัดส่ง" };

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true, deliverySlot: true } });
  if (!order) notFound();
  const addr = parseJson<{ line1: string; district: string; province: string; postcode: string }>(order.deliveryAddress, {
    line1: "", district: "", province: "", postcode: "",
  });

  return (
    <div className="mx-auto max-w-[720px] space-y-10 bg-white p-8 text-ink print:p-0">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-muted">ตัวอย่างก่อนพิมพ์</p>
        <PrintButton />
      </div>

      <section className="border-2 border-ink p-8">
        <div className="flex items-start justify-between">
          <p className="display text-3xl">Maison <span className="italic">Fleur</span></p>
          <p className="text-right text-sm">ออเดอร์ <b>{order.number}</b></p>
        </div>
        <p className="eyebrow mt-8 text-muted">ส่งถึง</p>
        <p className="display text-4xl">{order.recipientName}</p>
        <p className="mt-1 text-lg">{order.recipientPhone}</p>
        <p className="mt-3 text-lg">{addr.line1} {addr.district} {addr.province} {addr.postcode}</p>
        <div className="mt-8 flex justify-between border-t border-ink pt-4">
          <div>
            <p className="eyebrow text-muted">กำหนดส่ง</p>
            <p className="text-xl font-semibold">{thaiDate(order.deliveryDate, true)}</p>
            <p>ช่วง {order.deliverySlot.label}</p>
          </div>
          <div className="text-right">
            <p className="eyebrow text-muted">รายการ</p>
            {order.items.map((i) => (
              <p key={i.id}>{i.nameSnapshot} × {i.qty}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="break-before-page border border-dashed border-ink p-10 text-center">
        <p className="eyebrow mb-6 text-muted">การ์ดข้อความ</p>
        <p className="display whitespace-pre-wrap text-3xl italic leading-snug">
          {order.giftMessage || "—"}
        </p>
        <p className="mt-10 text-lg">{order.anonymous ? "จาก ผู้ไม่ประสงค์ออกนาม" : order.senderName ? `จาก ${order.senderName}` : ""}</p>
      </section>
    </div>
  );
}
