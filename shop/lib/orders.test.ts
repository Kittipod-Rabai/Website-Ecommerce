import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addDays, bangkokParts } from "@/lib/delivery";
import { cancelOrder, markOrderPaid, OrderError, placeOrder, type PlaceOrderInput } from "@/lib/orders";

const date = addDays(bangkokParts(new Date()).date, 3);
let variantId = "";
let slotId = "";

const input = (n: number): PlaceOrderInput => ({
  buyerEmail: `buyer${n}@example.com`,
  buyerPhone: "0812345678",
  recipientName: "ผู้รับ",
  recipientPhone: "0823456789",
  address: { line1: "99/9 ถนนสุขุมวิท", district: "คลองเตย", province: "กรุงเทพมหานคร", postcode: "10110" },
  deliveryDate: date,
  deliverySlotId: slotId,
  giftMessage: "",
  senderName: "",
  anonymous: false,
  cart: [{ variantId, qty: 1, addOnIds: [] }],
});

beforeAll(async () => {
  await db.setting.create({ data: { key: "defaultDailyCapacity", value: "30" } });
  await db.deliveryZone.create({ data: { name: "BKK", postcodes: JSON.stringify(["10"]), feeSatang: 10000, sameDayCutoff: "14:00" } });
  slotId = (await db.deliverySlot.create({ data: { label: "09:00 – 12:00", startTime: "09:00", endTime: "12:00" } })).id;
  const cat = await db.category.create({ data: { name: "ช่อ", slug: "t" } });
  const product = await db.product.create({
    data: { name: "ช่อทดสอบ", slug: "test", description: "ทดสอบ", categoryId: cat.id, variants: { create: [{ label: "M", priceSatang: 100000 }] } },
    include: { variants: true },
  });
  variantId = product.variants[0].id;
  await db.dailyCapacity.create({ data: { date, maxOrders: 3, usedOrders: 0 } });
});

describe("placeOrder — คิวต่อวัน", () => {
  it("คำนวณราคาจากฐานข้อมูลและบวกค่าส่งตามโซน", async () => {
    const order = await placeOrder(input(0));
    expect(order.subtotal).toBe(100000);
    expect(order.deliveryFee).toBe(10000);
    expect(order.total).toBe(110000);
    expect(order.status).toBe("PENDING_PAYMENT");
    await cancelOrder(order.id);
  });

  it("ไม่ขายเกินคิวสูงสุดแม้สั่งพร้อมกัน", async () => {
    const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => placeOrder(input(i + 1))));
    const ok = results.filter((r) => r.status === "fulfilled").length;
    const cap = await db.dailyCapacity.findUnique({ where: { date } });
    expect(ok).toBeLessThanOrEqual(3);
    expect(cap!.usedOrders).toBeLessThanOrEqual(3);
    expect(cap!.usedOrders).toBe(ok);
  });

  it("เมื่อคิวเต็มแล้วจะปฏิเสธออเดอร์ใหม่", async () => {
    // เติมให้เต็มก่อน (กรณีรอบก่อนหน้าได้ไม่ครบเพราะ SQLite ล็อกกัน)
    await db.dailyCapacity.update({ where: { date }, data: { usedOrders: 3 } });
    await expect(placeOrder(input(99))).rejects.toBeInstanceOf(OrderError);
  });

  it("ยกเลิกออเดอร์แล้วคืนคิว และยกเลิกซ้ำไม่คืนซ้ำ", async () => {
    await db.dailyCapacity.update({ where: { date }, data: { usedOrders: 1 } });
    const order = await placeOrder(input(100));
    expect((await db.dailyCapacity.findUnique({ where: { date } }))!.usedOrders).toBe(2);
    expect(await cancelOrder(order.id)).toBe(true);
    expect(await cancelOrder(order.id)).toBe(false);
    expect((await db.dailyCapacity.findUnique({ where: { date } }))!.usedOrders).toBe(1);
  });

  it("ยืนยันการชำระเงินซ้ำ (webhook ส่งซ้ำ) ได้ผลครั้งเดียว", async () => {
    const order = await placeOrder(input(101));
    expect(await markOrderPaid(order.number)).toBe(true);
    expect(await markOrderPaid(order.number)).toBe(false);
  });

  it("ปฏิเสธรหัสไปรษณีย์นอกพื้นที่จัดส่ง และวันที่ในอดีต", async () => {
    await expect(placeOrder({ ...input(102), address: { ...input(102).address, postcode: "50000" } })).rejects.toBeInstanceOf(OrderError);
    await expect(placeOrder({ ...input(103), deliveryDate: addDays(bangkokParts(new Date()).date, -1) })).rejects.toBeInstanceOf(OrderError);
  });
});
