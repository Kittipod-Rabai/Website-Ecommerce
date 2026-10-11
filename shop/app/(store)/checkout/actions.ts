"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { createPaymentSession } from "@/lib/payments";
import { listDateOptions, findZone, deliveryFee, type DateOption, type Slot } from "@/lib/delivery";
import { getDeliveryConfig, getSettings, OrderError, placeOrder, priceCart, type CartInput } from "@/lib/orders";

const cartSchema = z
  .array(
    z.object({
      variantId: z.string().min(1),
      qty: z.number().int().min(1).max(20),
      addOnIds: z.array(z.string()).max(10),
    }),
  )
  .min(1)
  .max(30);

export type DeliveryOptions =
  | { ok: false; error: string }
  | {
      ok: true;
      zoneName: string;
      fee: number;
      subtotal: number;
      freeOver: number;
      leadHours: number;
      nowIso: string;
      dates: DateOption[];
      slots: Slot[];
    };

/** Dates, slots and fee for a cart + postcode, evaluated on the server clock. */
export async function getDeliveryOptions(rawCart: CartInput, postcode: string): Promise<DeliveryOptions> {
  const parsed = cartSchema.safeParse(rawCart);
  if (!parsed.success) return { ok: false, error: "ตะกร้าไม่ถูกต้อง" };
  if (!/^\d{5}$/.test(postcode)) return { ok: false, error: "กรุณากรอกรหัสไปรษณีย์ 5 หลัก" };
  try {
    const [{ zones, slots, capacities }, settings, priced] = await Promise.all([
      getDeliveryConfig(),
      getSettings(),
      priceCart(parsed.data),
    ]);
    const zone = findZone(postcode, zones);
    if (!zone) return { ok: false, error: "ขออภัย ยังไม่รองรับการจัดส่งไปยังรหัสไปรษณีย์นี้ (รองรับกรุงเทพฯ และปริมณฑล)" };
    const now = new Date();
    return {
      ok: true,
      zoneName: zone.name,
      fee: deliveryFee(zone, priced.subtotal, settings.freeOverSatang),
      subtotal: priced.subtotal,
      freeOver: settings.freeOverSatang,
      leadHours: priced.leadHours,
      nowIso: now.toISOString(),
      dates: listDateOptions({
        now,
        zone,
        leadHours: priced.leadHours,
        slots,
        capacities,
        defaultCapacity: settings.defaultCapacity,
        daysAhead: 30,
      }),
      slots,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "เกิดข้อผิดพลาด" };
  }
}

const phone = z.string().regex(/^0\d{8,9}$/, "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)");

const orderSchema = z.object({
  buyerEmail: z.string().email("อีเมลไม่ถูกต้อง"),
  buyerPhone: phone,
  recipientName: z.string().trim().min(2, "กรุณากรอกชื่อผู้รับ").max(80),
  recipientPhone: phone,
  line1: z.string().trim().min(5, "กรุณากรอกที่อยู่").max(200),
  district: z.string().trim().min(2, "กรุณากรอกเขต/อำเภอ").max(80),
  province: z.string().trim().min(2, "กรุณากรอกจังหวัด").max(80),
  postcode: z.string().regex(/^\d{5}$/, "รหัสไปรษณีย์ 5 หลัก"),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "กรุณาเลือกวันจัดส่ง"),
  deliverySlotId: z.string().min(1, "กรุณาเลือกช่วงเวลา"),
  giftMessage: z.string().max(300, "ข้อความยาวเกิน 300 ตัวอักษร").default(""),
  senderName: z.string().max(60).default(""),
  anonymous: z.boolean().default(false),
  cart: cartSchema,
});

export type PlaceOrderResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function submitOrder(raw: unknown): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
    return { ok: false, error: "กรุณาตรวจสอบข้อมูลอีกครั้ง", fieldErrors };
  }
  const d = parsed.data;
  const session = await auth();
  try {
    const order = await placeOrder({
      userId: session?.user?.id,
      buyerEmail: d.buyerEmail,
      buyerPhone: d.buyerPhone,
      recipientName: d.recipientName,
      recipientPhone: d.recipientPhone,
      address: { line1: d.line1, district: d.district, province: d.province, postcode: d.postcode },
      deliveryDate: d.deliveryDate,
      deliverySlotId: d.deliverySlotId,
      giftMessage: d.giftMessage,
      senderName: d.senderName,
      anonymous: d.anonymous,
      cart: d.cart,
    });
    const url = await createPaymentSession(order);
    return { ok: true, redirectUrl: url };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("submitOrder failed", e);
    return { ok: false, error: "ไม่สามารถสร้างออเดอร์ได้ กรุณาลองใหม่อีกครั้ง" };
  }
}
