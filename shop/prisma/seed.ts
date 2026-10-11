import { PrismaClient, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRODUCT_PHOTOS, photoUrl } from "./photos";

const db = new PrismaClient();

// Dev-only seed credentials (test values for local development).
const ADMIN = { email: "admin@maisonfleur.test", password: "admin1234", name: "เจ้าของร้าน" };
const CUSTOMER = { email: "customer@maisonfleur.test", password: "customer1234", name: "คุณลูกค้า ทดสอบ" };

const PALETTES: Record<string, string[]> = {
  pink: ["#c4506b", "#e8a0b0", "#f6d3da"],
  red: ["#a3162f", "#d6405a", "#f0a3b0"],
  white: ["#f4efe8", "#e2d8cc", "#cfc3b4"],
  yellow: ["#e6b422", "#f3d46b", "#fbeab0"],
  purple: ["#6b4a8f", "#a583c4", "#d9c7ea"],
  peach: ["#e08a6a", "#f2b69c", "#fadccc"],
  mixed: ["#c4506b", "#e6b422", "#a583c4", "#f4efe8"],
};

const occasions = [
  { name: "วันเกิด", slug: "birthday", tagline: "ของขวัญที่สดใสที่สุดของวันพิเศษ", hue: 20 },
  { name: "วาเลนไทน์", slug: "valentine", tagline: "บอกรักด้วยกุหลาบช่อโปรด", hue: 350 },
  { name: "แสดงความยินดี", slug: "congrats", tagline: "ฉลองทุกความสำเร็จ", hue: 45 },
  { name: "ขอบคุณ", slug: "thank-you", tagline: "คำขอบคุณที่ไม่ต้องเอ่ยเป็นคำ", hue: 150 },
  { name: "เยี่ยมไข้", slug: "get-well", tagline: "กำลังใจที่ส่งถึงมือ", hue: 90 },
  { name: "แสดงความเสียใจ", slug: "sympathy", tagline: "ความอาลัยอย่างสงบและให้เกียรติ", hue: 260 },
];

const categories = [
  { name: "ช่อดอกไม้", slug: "bouquets" },
  { name: "กระเช้าดอกไม้", slug: "baskets" },
  { name: "แจกันดอกไม้", slug: "vases" },
  { name: "ดอกไม้แห้ง", slug: "dried" },
];

type P = {
  name: string;
  slug: string;
  cat: string;
  color: keyof typeof PALETTES;
  flowers: string[];
  occ: string[];
  prices: [number, number, number]; // S, M, L in baht
  best?: boolean;
  desc: string;
};

const products: P[] = [
  { name: "Rouge Éternel", slug: "rouge-eternel", cat: "bouquets", color: "red", flowers: ["กุหลาบ"], occ: ["valentine", "birthday"], prices: [1290, 1890, 2690], best: true, desc: "กุหลาบแดงเข้มคัดพิเศษ จัดช่อทรงกลมห่อกระดาษคราฟต์สีครีม ผูกด้วยริบบิ้นผ้าไหม" },
  { name: "Blush Garden", slug: "blush-garden", cat: "bouquets", color: "pink", flowers: ["กุหลาบ", "ไฮเดรนเยีย"], occ: ["birthday", "thank-you"], prices: [990, 1490, 2190], best: true, desc: "โทนชมพูอ่อนละมุน ผสมกุหลาบและไฮเดรนเยียให้ช่อดูฟูฟ่องเป็นธรรมชาติ" },
  { name: "Blanc Pur", slug: "blanc-pur", cat: "bouquets", color: "white", flowers: ["ลิลลี่", "กุหลาบขาว"], occ: ["sympathy", "get-well", "congrats"], prices: [1190, 1690, 2390], desc: "ช่อสีขาวล้วน เรียบหรู สื่อถึงความสงบและความจริงใจ" },
  { name: "Soleil d'Été", slug: "soleil-d-ete", cat: "bouquets", color: "yellow", flowers: ["ทานตะวัน", "เบญจมาศ"], occ: ["congrats", "get-well", "birthday"], prices: [890, 1390, 1990], best: true, desc: "ทานตะวันสดใสให้พลังงานบวก เหมาะกับทุกการเฉลิมฉลอง" },
  { name: "Lavande Rêve", slug: "lavande-reve", cat: "bouquets", color: "purple", flowers: ["ลาเวนเดอร์", "ลิซิแอนทัส"], occ: ["thank-you", "birthday"], prices: [1090, 1590, 2290], desc: "โทนม่วงลาเวนเดอร์ กลิ่นหอมอ่อนๆ ให้ความรู้สึกผ่อนคลาย" },
  { name: "Pêche Douce", slug: "peche-douce", cat: "bouquets", color: "peach", flowers: ["กุหลาบพีช", "ดอกแอสเตอร์"], occ: ["birthday", "congrats"], prices: [1090, 1590, 2290], desc: "สีพีชอุ่นๆ ชวนให้ยิ้ม จัดช่อทรงยาวสไตล์ยุโรป" },
  { name: "Jardin Sauvage", slug: "jardin-sauvage", cat: "bouquets", color: "mixed", flowers: ["ดอกไม้ผสม", "ยูคาลิปตัส"], occ: ["birthday", "thank-you", "congrats"], prices: [990, 1490, 2190], desc: "ช่อสไตล์สวนป่า ผสมดอกไม้หลายชนิดและใบยูคาลิปตัส" },
  { name: "Cent Roses", slug: "cent-roses", cat: "bouquets", color: "red", flowers: ["กุหลาบแดง 99 ดอก"], occ: ["valentine"], prices: [4990, 6990, 9990], desc: "กุหลาบแดง 99 ดอก สำหรับคำสัญญาที่ยิ่งใหญ่ที่สุด" },
  { name: "Rose Poudrée", slug: "rose-poudree", cat: "bouquets", color: "pink", flowers: ["กุหลาบพาสเทล"], occ: ["valentine", "thank-you"], prices: [1290, 1790, 2490], desc: "กุหลาบชมพูพาสเทลในห่อกระดาษสีเทาควันบุหรี่" },
  { name: "Panier Blanc", slug: "panier-blanc", cat: "baskets", color: "white", flowers: ["ลิลลี่", "ไฮเดรนเยีย"], occ: ["get-well", "sympathy"], prices: [1590, 2290, 3190], desc: "กระเช้าสีขาวสงบ พร้อมวางบนโต๊ะข้างเตียงหรือหน้างาน" },
  { name: "Panier Printemps", slug: "panier-printemps", cat: "baskets", color: "mixed", flowers: ["ดอกไม้ผสม"], occ: ["congrats", "get-well", "birthday"], prices: [1390, 1990, 2790], best: true, desc: "กระเช้าดอกไม้หลากสีสดใส ใส่ใจทุกรายละเอียด" },
  { name: "Panier Doré", slug: "panier-dore", cat: "baskets", color: "yellow", flowers: ["ทานตะวัน", "ดาวเรือง"], occ: ["congrats"], prices: [1490, 2090, 2890], desc: "กระเช้าโทนทองสำหรับงานเปิดร้านหรือแสดงความยินดี" },
  { name: "Vase Silence", slug: "vase-silence", cat: "vases", color: "white", flowers: ["ลิลลี่", "กุหลาบขาว"], occ: ["sympathy"], prices: [2490, 3490, 4990], desc: "แจกันแก้วทรงสูง จัดดอกไม้สีขาวล้วนอย่างสงบ ให้เกียรติ" },
  { name: "Vase Orchidée", slug: "vase-orchidee", cat: "vases", color: "purple", flowers: ["กล้วยไม้"], occ: ["congrats", "thank-you"], prices: [1990, 2790, 3790], desc: "กล้วยไม้ม่วงในแจกันเซรามิก เหมาะกับห้องทำงานและบ้าน" },
  { name: "Vase Tulipe", slug: "vase-tulipe", cat: "vases", color: "pink", flowers: ["ทิวลิป"], occ: ["birthday", "thank-you"], prices: [1690, 2390, 3290], desc: "ทิวลิปชมพูในแจกันแก้วใส เรียบง่ายแต่โดดเด่น" },
  { name: "Vase Pivoine", slug: "vase-pivoine", cat: "vases", color: "peach", flowers: ["พีโอนี"], occ: ["birthday", "valentine"], prices: [2290, 3190, 4390], desc: "พีโอนีฟูฟ่องหายากตามฤดูกาล จัดในแจกันทรงกลม" },
  { name: "Sec Doré", slug: "sec-dore", cat: "dried", color: "peach", flowers: ["ดอกไม้แห้ง", "ปุยฝ้าย"], occ: ["thank-you", "birthday"], prices: [890, 1290, 1790], desc: "ช่อดอกไม้แห้งโทนอบอุ่น เก็บไว้ได้นานหลายเดือน" },
  { name: "Sec Lavande", slug: "sec-lavande", cat: "dried", color: "purple", flowers: ["ลาเวนเดอร์แห้ง"], occ: ["thank-you", "get-well"], prices: [790, 1190, 1590], desc: "ลาเวนเดอร์แห้งกลิ่นหอม วางประดับหรือใส่ตู้เสื้อผ้า" },
  { name: "Sec Neige", slug: "sec-neige", cat: "dried", color: "white", flowers: ["ยิปโซแห้ง", "ปุยฝ้าย"], occ: ["congrats", "thank-you"], prices: [890, 1290, 1790], desc: "ช่อดอกไม้แห้งสีขาวนวล สไตล์มินิมอล" },
  { name: "Mille Fleurs", slug: "mille-fleurs", cat: "bouquets", color: "mixed", flowers: ["ดอกไม้ผสม"], occ: ["birthday", "congrats", "valentine"], prices: [1490, 2190, 3090], best: true, desc: "ช่อใหญ่ใจกว้าง รวมดอกไม้ตามฤดูกาลที่สวยที่สุดของวัน" },
];

const addOns = [
  { name: "แจกันแก้วทรงสูง", priceSatang: 39000, hue: 200 },
  { name: "ช็อกโกแลตกล่อง", priceSatang: 45000, hue: 25 },
  { name: "ตุ๊กตาหมีตัวเล็ก", priceSatang: 35000, hue: 340 },
  { name: "การ์ดพิเศษพิมพ์ทอง", priceSatang: 9000, hue: 45 },
];

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

  const occMap: Record<string, string> = {};
  for (const o of occasions) occMap[o.slug] = (await db.occasion.create({ data: o })).id;
  const catMap: Record<string, string> = {};
  for (const c of categories) catMap[c.slug] = (await db.category.create({ data: c })).id;

  const variantIds: { id: string; price: number; name: string }[] = [];
  for (const p of products) {
    const created = await db.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.desc,
        categoryId: catMap[p.cat],
        palette: JSON.stringify(PALETTES[p.color]),
        images: JSON.stringify((PRODUCT_PHOTOS[p.slug] ?? []).map(photoUrl)),
        flowerTypes: JSON.stringify(p.flowers),
        colorTag: p.color,
        bestseller: !!p.best,
        occasions: { create: p.occ.map((s) => ({ occasionId: occMap[s] })) },
        variants: {
          create: (["S", "M", "L"] as const).map((label, i) => ({
            label,
            priceSatang: p.prices[i] * 100,
            leadTimeHours: label === "L" ? 6 : 4,
          })),
        },
      },
      include: { variants: true },
    });
    for (const v of created.variants) variantIds.push({ id: v.id, price: v.priceSatang, name: `${p.name} (${v.label})` });
  }

  for (const a of addOns) await db.addOn.create({ data: a });

  await db.deliveryZone.createMany({
    data: [
      { name: "กรุงเทพมหานคร", postcodes: JSON.stringify(["10"]), feeSatang: 10000, sameDayCutoff: "14:00" },
      { name: "ปริมณฑล (นนทบุรี ปทุมธานี สมุทรปราการ)", postcodes: JSON.stringify(["11", "12", "10270", "10280", "10540"]), feeSatang: 18000, sameDayCutoff: "12:00" },
    ],
  });
  const slots = await Promise.all(
    [
      { label: "09:00 – 12:00", startTime: "09:00", endTime: "12:00" },
      { label: "12:00 – 15:00", startTime: "12:00", endTime: "15:00" },
      { label: "15:00 – 18:00", startTime: "15:00", endTime: "18:00" },
    ].map((s) => db.deliverySlot.create({ data: s })),
  );
  await db.setting.createMany({
    data: [
      { key: "defaultDailyCapacity", value: "30" },
      { key: "freeShippingOverSatang", value: "300000" },
      { key: "lowCapacityThreshold", value: "5" },
    ],
  });

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
  console.log(`Seeded ${products.length} products, ${n - 1} demo orders.`);
}

main().finally(() => db.$disconnect());
