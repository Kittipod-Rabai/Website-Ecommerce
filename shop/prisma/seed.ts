import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedCatalog } from "./catalog";

const db = new PrismaClient();

// Dev-only seed credentials (test values for local development).
const ADMIN = { email: "admin@maisonfleur.test", password: "admin1234", name: "เจ้าของร้าน" };
const CUSTOMER = { email: "customer@maisonfleur.test", password: "customer1234", name: "คุณลูกค้า ทดสอบ" };


function ymd(d: Date) {
  const bkk = new Date(d.getTime() + 7 * 3600_000);
  return bkk.toISOString().slice(0, 10);
}

async function main() {
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.cartItem.deleteMany();
  await db.cart.deleteMany();
  await db.productOccasion.deleteMany();
  await db.variant.deleteMany();
  await db.product.deleteMany();
  await db.occasion.deleteMany();
  await db.category.deleteMany();
  await db.addOn.deleteMany();
  await db.deliveryZone.deleteMany();
  await db.deliverySlot.deleteMany();
  await db.dailyCapacity.deleteMany();
  await db.setting.deleteMany();
  await db.savedAddress.deleteMany();
  await db.user.deleteMany();

  const admin = await db.user.create({
    data: { email: ADMIN.email, name: ADMIN.name, role: "ADMIN", passwordHash: await bcrypt.hash(ADMIN.password, 10) },
  });
  const customer = await db.user.create({
    data: { email: CUSTOMER.email, name: CUSTOMER.name, passwordHash: await bcrypt.hash(CUSTOMER.password, 10) },
  });
  void admin;

  await db.savedAddress.create({
    data: { userId: customer.id, recipientName: "คุณแม่", phone: "0812345678", line1: "99/9 ซอยสุขุมวิท 24", district: "คลองเตย", province: "กรุงเทพมหานคร", postcode: "10110" },
  });

  const { slots, variantIds } = await seedCatalog(db);

  // ---- demo orders: last 30 days + upcoming deliveries ----
  const now = new Date();
  const names = ["สมชาย", "มาลี", "วิชัย", "นภา", "ธนา", "พิมพ์ชนก", "อนันต์", "กาญจนา"];
  const statuses: OrderStatus[] = ["DELIVERED", "DELIVERED", "DELIVERED", "PAID", "PREPARING"];
  let n = 1;
  const used: Record<string, number> = {};
  for (let day = 30; day >= -3; day--) {
    const date = new Date(now.getTime() - day * 86400_000);
    const key = ymd(date);
    const count = day < 0 ? 2 + (n % 3) : 1 + ((n * 7) % 4) + (day % 7 === 0 ? 2 : 0);
    for (let k = 0; k < count; k++) {
      const v = variantIds[(n * 5) % variantIds.length];
      const qty = 1 + (n % 5 === 0 ? 1 : 0);
      const fee = 10000;
      const status: OrderStatus = day > 1 ? "DELIVERED" : day >= 0 ? statuses[n % statuses.length] : n % 2 ? "PAID" : "PREPARING";
      await db.order.create({
        data: {
          number: `MF${String(10000 + n)}`,
          userId: n % 4 === 0 ? customer.id : null,
          buyerEmail: `buyer${n}@example.com`,
          buyerPhone: "0891234567",
          status,
          subtotal: v.price * qty,
          deliveryFee: fee,
          total: v.price * qty + fee,
          recipientName: names[n % names.length],
          recipientPhone: "0823456789",
          deliveryAddress: JSON.stringify({ line1: `${n}/1 ถนนสาทร`, district: "สาทร", province: "กรุงเทพมหานคร", postcode: "10120" }),
          deliveryDate: key,
          deliverySlotId: slots[n % 3].id,
          giftMessage: n % 3 === 0 ? "สุขสันต์วันเกิดนะ ขอให้มีความสุขมากๆ" : "",
          senderName: n % 3 === 0 ? "จากคนที่รักเธอ" : "",
          createdAt: new Date(date.getTime() - 3600_000 * (2 + (n % 8))),
          items: { create: [{ variantId: v.id, nameSnapshot: v.name, priceSnapshot: v.price, qty, addOns: "[]" }] },
        },
      });
      used[key] = (used[key] ?? 0) + 1;
      n++;
    }
  }
  for (const [date, usedOrders] of Object.entries(used)) {
    await db.dailyCapacity.create({ data: { date, maxOrders: 30, usedOrders } });
  }
  console.log(`Seeded ${variantIds.length / 3} products, ${n - 1} demo orders.`);
}

main().finally(() => db.$disconnect());
