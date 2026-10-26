import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/payments";
import { cancelOrder, markOrderPaid } from "@/lib/orders";
import { sendOrderConfirmation } from "@/lib/email";
import { formatBaht } from "@/lib/money";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

// หน้าจ่ายเงินจำลอง: ใช้ได้ตอนพัฒนา หรือบนเซิร์ฟเวอร์ที่ตั้ง ALLOW_MOCK_PAYMENT=true (โหมดสาธิต)
// และปิดเสมอเมื่อมีคีย์ Stripe จริง กันไม่ให้ใครข้ามการชำระเงินจริง
const mockEnabled = () =>
  !getStripe() && (process.env.NODE_ENV !== "production" || process.env.ALLOW_MOCK_PAYMENT === "true");

export default async function MockPayPage({ params }: { params: Promise<{ number: string }> }) {
  if (!mockEnabled()) notFound();
  const { number } = await params;
  const order = await db.order.findUnique({ where: { number } });
  if (!order) notFound();
  if (order.status !== "PENDING_PAYMENT") redirect(`/order/${number}`);

  async function pay() {
    "use server";
    if (!mockEnabled()) return;
    if (await markOrderPaid(number, `mock_${number}`)) await sendOrderConfirmation(number);
    redirect(`/order/${number}?paid=1`);
  }
  async function cancel() {
    "use server";
    if (!mockEnabled()) return;
    const o = await db.order.findUnique({ where: { number } });
    if (o) await cancelOrder(o.id);
    redirect(`/order/${number}?cancelled=1`);
  }

  return (
    <div className="container-x flex min-h-[80vh] items-center justify-center pb-20 pt-32">
      <div className="w-full max-w-md border border-[var(--line)] rounded-3xl bg-snow/60 p-10 text-center">
        <p className="eyebrow mb-4 text-accent">จำลองการชำระเงิน (โหมดสาธิต ไม่หักเงินจริง)</p>
        <h1 className="display text-4xl">ออเดอร์ {order.number}</h1>
        <p className="display mt-6 text-5xl tabular-nums">{formatBaht(order.total)}</p>
        <p className="mt-4 text-xs text-muted">
          หน้านี้ใช้แทน Stripe สำหรับสาธิต ไม่มีการหักเงินจริง เมื่อตั้งค่า STRIPE_SECRET_KEY ระบบจะเปลี่ยนไปใช้ Stripe Checkout (บัตร + PromptPay) โดยอัตโนมัติ
        </p>
        <form className="mt-8 grid gap-3">
          <Button formAction={pay} className="w-full">จำลองชำระเงินสำเร็จ</Button>
          <Button formAction={cancel} variant="outline" className="w-full">ยกเลิก</Button>
        </form>
      </div>
    </div>
  );
}
