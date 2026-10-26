import Stripe from "stripe";
import type { Order } from "@prisma/client";

let stripe: Stripe | null = null;
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripe ??= new Stripe(key);
  return stripe;
}

export const siteUrl = () => process.env.AUTH_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000";

/**
 * Returns the URL the customer should be sent to in order to pay.
 * With STRIPE_SECRET_KEY set → Stripe Checkout (card + PromptPay, test mode).
 * Without it (local dev) → built-in mock payment page.
 */
export async function createPaymentSession(order: Order): Promise<string> {
  const s = getStripe();
  if (!s) return `/pay/mock/${order.number}`;

  const session = await s.checkout.sessions.create({
    mode: "payment",
    allowed_payment_method_types: ["card", "promptpay"],
    customer_email: order.buyerEmail,
    client_reference_id: order.number,
    metadata: { orderNumber: order.number },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "thb",
          unit_amount: order.total,
          product_data: { name: `Maison Fleur — ออเดอร์ ${order.number}` },
        },
      },
    ],
    success_url: `${siteUrl()}/order/${order.number}?paid=1`,
    cancel_url: `${siteUrl()}/order/${order.number}?cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}
