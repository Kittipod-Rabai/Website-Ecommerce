import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/payments";
import { cancelOrder, markOrderPaid } from "@/lib/orders";
import { sendOrderConfirmation } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const s = event.data.object as Stripe.Checkout.Session;
      // PromptPay: "completed" can fire before funds arrive; only act when paid.
      if (s.payment_status === "paid" && s.metadata?.orderNumber) {
        const first = await markOrderPaid(s.metadata.orderNumber, typeof s.payment_intent === "string" ? s.payment_intent : undefined);
        if (first) await sendOrderConfirmation(s.metadata.orderNumber);
      }
      break;
    }
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const num = s.metadata?.orderNumber;
      if (num) {
        const order = await db.order.findUnique({ where: { number: num } });
        if (order?.status === "PENDING_PAYMENT") await cancelOrder(order.id);
      }
      break;
    }
  }
  // Always 200 for handled/ignored events so Stripe stops retrying.
  return NextResponse.json({ received: true });
}
