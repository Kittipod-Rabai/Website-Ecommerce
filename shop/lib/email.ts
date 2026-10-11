import { db } from "@/lib/db";
import { formatBaht } from "@/lib/money";

/**
 * Order confirmation email. Stub for now: logs to the server console.
 * To go live, add RESEND_API_KEY and send `html` through the Resend API here.
 */
export async function sendOrderConfirmation(orderNumber: string) {
  const order = await db.order.findUnique({
    where: { number: orderNumber },
    include: { items: true, deliverySlot: true },
  });
  if (!order) return;
  const html = `
    <h1>ขอบคุณสำหรับออเดอร์ ${order.number}</h1>
    <p>จัดส่งวันที่ ${order.deliveryDate} ช่วง ${order.deliverySlot.label} ถึงคุณ ${order.recipientName}</p>
    <ul>${order.items.map((i) => `<li>${i.nameSnapshot} × ${i.qty}</li>`).join("")}</ul>
    <p>ยอดรวม ${formatBaht(order.total)}</p>`;
  if (process.env.RESEND_API_KEY) {
    // TODO(launch): POST https://api.resend.com/emails { from, to: order.buyerEmail, subject, html }
  }
  console.log(`[email stub] -> ${order.buyerEmail}: order ${order.number} confirmed (${html.length} bytes)`);
}
