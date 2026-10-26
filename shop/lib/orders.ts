import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";
import {
  addDays,
  bangkokParts,
  deliveryFee,
  findZone,
  validateSelection,
  type Capacity,
  type Slot,
  type Zone,
} from "@/lib/delivery";

export const PENDING_TTL_MS = 30 * 60_000;

export type CartInput = { variantId: string; qty: number; addOnIds: string[] }[];

export async function getSettings() {
  const rows = await db.setting.findMany();
  const m = new Map(rows.map((r) => [r.key, r.value]));
  return {
    defaultCapacity: Number(m.get("defaultDailyCapacity") ?? 30),
    freeOverSatang: Number(m.get("freeShippingOverSatang") ?? 0),
    lowCapacityThreshold: Number(m.get("lowCapacityThreshold") ?? 5),
  };
}

export async function getDeliveryConfig(): Promise<{ zones: Zone[]; slots: Slot[]; capacities: Capacity[] }> {
  const today = bangkokParts(new Date()).date;
  const [zones, slots, capacities] = await Promise.all([
    db.deliveryZone.findMany(),
    db.deliverySlot.findMany({ orderBy: { startTime: "asc" } }),
    db.dailyCapacity.findMany({ where: { date: { gte: today, lte: addDays(today, 61) } } }),
  ]);
  return {
    zones: zones.map((z) => ({ ...z, postcodes: parseJson<string[]>(z.postcodes, []) })),
    slots,
    capacities,
  };
}

/** Re-price a cart from the database. Never trust prices sent by the client. */
export async function priceCart(items: CartInput) {
  if (items.length === 0) throw new Error("ตะกร้าว่างเปล่า");
  const variants = await db.variant.findMany({
    where: { id: { in: items.map((i) => i.variantId) } },
    include: { product: true },
  });
  const addOnIds = [...new Set(items.flatMap((i) => i.addOnIds))];
  const addOns = await db.addOn.findMany({ where: { id: { in: addOnIds }, active: true } });

  let subtotal = 0;
  let leadHours = 0;
  const lines = items.map((i) => {
    const v = variants.find((x) => x.id === i.variantId);
    if (!v || !v.product.active) throw new Error("มีสินค้าในตะกร้าที่ไม่พร้อมจำหน่ายแล้ว");
    const qty = Math.max(1, Math.min(20, Math.floor(i.qty)));
    const chosen = i.addOnIds.map((id) => addOns.find((a) => a.id === id)).filter((a): a is NonNullable<typeof a> => !!a);
    const unit = v.priceSatang + chosen.reduce((s, a) => s + a.priceSatang, 0);
    subtotal += unit * qty;
    leadHours = Math.max(leadHours, v.leadTimeHours);
    return {
      variantId: v.id,
      name: `${v.product.name} (${v.label})`,
      unitPrice: v.priceSatang,
      qty,
      addOns: chosen.map((a) => ({ name: a.name, priceSatang: a.priceSatang })),
      lineTotal: unit * qty,
    };
  });
  return { lines, subtotal, leadHours };
}

function newOrderNumber() {
  return "MF" + randomBytes(5).toString("hex").toUpperCase();
}

export type PlaceOrderInput = {
  userId?: string | null;
  buyerEmail: string;
  buyerPhone: string;
  recipientName: string;
  recipientPhone: string;
  address: { line1: string; district: string; province: string; postcode: string };
  deliveryDate: string;
  deliverySlotId: string;
  giftMessage: string;
  senderName: string;
  anonymous: boolean;
  cart: CartInput;
};

export class OrderError extends Error {}

/** Release the capacity held by an order (idempotent per status transition). */
async function releaseCapacity(tx: Pick<typeof db, "dailyCapacity">, date: string) {
  await tx.dailyCapacity.updateMany({ where: { date, usedOrders: { gt: 0 } }, data: { usedOrders: { decrement: 1 } } });
}

/** Cancel unpaid orders older than the TTL and give their delivery slot back. */
export async function expireStaleOrders(now = new Date()) {
  const stale = await db.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: new Date(now.getTime() - PENDING_TTL_MS) } },
    select: { id: true, deliveryDate: true },
  });
  for (const o of stale) {
    await db.$transaction(async (tx) => {
      const res = await tx.order.updateMany({ where: { id: o.id, status: "PENDING_PAYMENT" }, data: { status: "CANCELLED" } });
      if (res.count === 1) await releaseCapacity(tx, o.deliveryDate);
    });
  }
}

/**
 * สร้างแถวคิวของวันนั้นถ้ายังไม่มี ทำนอกทรานแซกชัน และกลืน error กรณีมีคนสร้างพร้อมกัน
 * (บน PostgreSQL คำสั่งที่ error ในทรานแซกชันจะทำให้ทั้งทรานแซกชันใช้ต่อไม่ได้)
 */
async function ensureCapacityRow(date: string, maxOrders: number) {
  if (await db.dailyCapacity.findUnique({ where: { date } })) return;
  try {
    await db.dailyCapacity.create({ data: { date, maxOrders, usedOrders: 0 } });
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
}

export async function placeOrder(input: PlaceOrderInput, now = new Date()) {
  await expireStaleOrders(now);
  const [{ zones, slots, capacities }, settings, priced] = await Promise.all([
    getDeliveryConfig(),
    getSettings(),
    priceCart(input.cart),
  ]);

  const zone = findZone(input.address.postcode, zones);
  if (!zone) throw new OrderError("ขออภัย ยังไม่รองรับการจัดส่งไปยังรหัสไปรษณีย์นี้");

  const check = validateSelection({
    now,
    zone,
    date: input.deliveryDate,
    slotId: input.deliverySlotId,
    leadHours: priced.leadHours,
    slots,
    capacities,
    defaultCapacity: settings.defaultCapacity,
  });
  if (!check.ok) throw new OrderError(check.error);

  const fee = deliveryFee(zone, priced.subtotal, settings.freeOverSatang);
  const number = newOrderNumber();

  // Reserve one delivery-capacity unit atomically. Two concurrent checkouts can
  // never push usedOrders above maxOrders.
  await ensureCapacityRow(input.deliveryDate, settings.defaultCapacity);
  return db.$transaction(async (tx) => {
    const cap = await tx.dailyCapacity.findUnique({ where: { date: input.deliveryDate } });
    const max = cap?.maxOrders ?? settings.defaultCapacity;
    const reserved = await tx.dailyCapacity.updateMany({
      where: { date: input.deliveryDate, closed: false, usedOrders: { lt: max } },
      data: { usedOrders: { increment: 1 } },
    });
    if (reserved.count !== 1) throw new OrderError("วันดังกล่าวคิวเต็มแล้ว กรุณาเลือกวันอื่น");

    return tx.order.create({
      data: {
        number,
        userId: input.userId ?? null,
        buyerEmail: input.buyerEmail.toLowerCase(),
        buyerPhone: input.buyerPhone,
        status: "PENDING_PAYMENT",
        subtotal: priced.subtotal,
        deliveryFee: fee,
        total: priced.subtotal + fee,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        deliveryAddress: JSON.stringify(input.address),
        deliveryDate: input.deliveryDate,
        deliverySlotId: input.deliverySlotId,
        giftMessage: input.giftMessage,
        senderName: input.anonymous ? "" : input.senderName,
        anonymous: input.anonymous,
        items: {
          create: priced.lines.map((l) => ({
            variantId: l.variantId,
            nameSnapshot: l.name,
            priceSnapshot: l.unitPrice,
            qty: l.qty,
            addOns: JSON.stringify(l.addOns),
          })),
        },
      },
    });
  });
}

/** Mark an order as paid. Safe to call repeatedly (webhooks retry). */
export async function markOrderPaid(orderNumber: string, paymentIntentId?: string) {
  const res = await db.order.updateMany({
    where: { number: orderNumber, status: "PENDING_PAYMENT" },
    data: { status: "PAID", ...(paymentIntentId ? { paymentIntentId } : {}) },
  });
  return res.count === 1;
}

export async function cancelOrder(orderId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === "CANCELLED" || order.status === "REFUNDED" || order.status === "DELIVERED") return false;
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
    await releaseCapacity(tx, order.deliveryDate);
    return true;
  });
}
