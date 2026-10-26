// ตั้งค่าร้านครั้งแรกบนเซิร์ฟเวอร์จริง (ปลอดภัยต่อการรันซ้ำ — ไม่ลบหรือเขียนทับข้อมูลที่มีอยู่)
//   - ถ้ายังไม่มีแอดมิน → สร้างจาก ADMIN_EMAIL / ADMIN_PASSWORD
//   - ถ้ายังไม่มีสินค้า → ใส่หมวด โอกาส สินค้าตัวอย่าง โซน/ช่วงเวลาจัดส่ง
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedCatalog } from "./catalog";

const db = new PrismaClient();

async function main() {
  const adminCount = await db.user.count({ where: { role: "ADMIN" } });
  if (adminCount === 0) {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!email || !password || password.length < 10) {
      throw new Error(
        "ยังไม่มีแอดมินในระบบ: ต้องตั้งค่า ADMIN_EMAIL และ ADMIN_PASSWORD (อย่างน้อย 10 ตัวอักษร) ก่อน deploy ครั้งแรก",
      );
    }
    await db.user.create({
      data: { email, name: "เจ้าของร้าน", role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) },
    });
    console.log(`สร้างบัญชีแอดมิน ${email} แล้ว`);
  } else {
    console.log("มีบัญชีแอดมินอยู่แล้ว ข้ามขั้นตอนนี้");
  }

  if ((await db.product.count()) === 0) {
    await seedCatalog(db);
    console.log("ใส่ข้อมูลร้านตั้งต้นแล้ว (สินค้า โอกาส โซนจัดส่ง)");
  } else {
    console.log("มีสินค้าอยู่แล้ว ข้ามขั้นตอนนี้");
  }
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
