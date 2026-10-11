# Maison Fleur — เว็บขายดอกไม้

เว็บอีคอมเมิร์ซร้านดอกไม้ ดีไซน์แนว premium minimal เลือกวัน-เวลาจัดส่งได้ มีตะกร้า ชำระเงิน และแดชบอร์ดฝั่งผู้ขาย

**เทคโนโลยี:** Next.js 15 · TypeScript · Tailwind CSS 4 · Prisma · SQLite (ตอนพัฒนา) · Auth.js · Stripe

## วิธีรันบนเครื่องใหม่ (ทำครั้งเดียว)

**สิ่งที่ต้องมี:** [Node.js](https://nodejs.org) เวอร์ชัน 20 ขึ้นไป (เลือกรุ่น LTS) และ Git — ไม่ต้องติดตั้งฐานข้อมูลหรือ Docker

```bash
git clone https://github.com/Kittipod-Rabai/Website-Ecommerce.git
cd Website-Ecommerce/shop
npm install
npm run setup
npm run dev
```

เปิดเบราว์เซอร์ไปที่ <http://localhost:3000>

`npm run setup` จะทำให้อัตโนมัติ: สร้างไฟล์ `.env` (พร้อมสุ่มคีย์), สร้างฐานข้อมูล SQLite และใส่ข้อมูลตัวอย่าง (ดอกไม้ 20 ช่อ, โอกาสต่างๆ, ออเดอร์ตัวอย่าง)

## บัญชีทดสอบ

| บทบาท | อีเมล | รหัสผ่าน |
|---|---|---|
| เจ้าของร้าน (แอดมิน) | `admin@maisonfleur.test` | `admin1234` |
| ลูกค้า | `customer@maisonfleur.test` | `customer1234` |

ใช้สำหรับเครื่องพัฒนาเท่านั้น (ค่าอยู่ใน `shop/prisma/seed.ts`) ห้ามใช้บนเว็บจริง

## ลองสั่งซื้อ

1. เลือกช่อดอกไม้ → ใส่ตะกร้า → ชำระเงิน
2. กรอกที่อยู่ (รหัสไปรษณีย์ `10110` อยู่ในโซนกรุงเทพฯ) แล้วเลือกวันและช่วงเวลาจัดส่ง
3. กดชำระเงิน จะพาไปหน้า **จำลองชำระเงิน** (ยังไม่ต้องใส่ Stripe) กด "จำลองชำระเงินสำเร็จ"
4. ดูผลที่หน้าติดตามออเดอร์ และฝั่งแอดมินที่ `/admin`

### ใช้ Stripe จริง (โหมดทดสอบ) — ไม่บังคับ

ใส่ค่า `STRIPE_SECRET_KEY` และ `STRIPE_WEBHOOK_SECRET` ในไฟล์ `shop/.env` ระบบจะเปลี่ยนไปใช้ Stripe Checkout (บัตรและ PromptPay) อัตโนมัติ แล้วตั้ง webhook ไปที่ `/api/webhooks/stripe`

## คำสั่งที่ใช้บ่อย (รันในโฟลเดอร์ `shop`)

| คำสั่ง | ทำอะไร |
|---|---|
| `npm run dev` | รันเว็บโหมดพัฒนา |
| `npm run build` / `npm start` | สร้างและรันโหมดใช้งานจริง |
| `npm test` | รันชุดทดสอบ |
| `npm run lint` / `npm run typecheck` | ตรวจโค้ด |
| `npm run db:reset` | ล้างฐานข้อมูลแล้วสร้างใหม่ |
| `npm run db:seed` | ใส่ข้อมูลตัวอย่างใหม่ |

## ปัญหาที่พบบ่อย

- **พอร์ต 3000 ถูกใช้อยู่:** รัน `npx next dev -p 3001` แล้วเปิด <http://localhost:3001> (และแก้ `AUTH_URL` ใน `.env` ให้ตรง)
- **ล็อกอินไม่ได้หลังย้ายเครื่อง:** รัน `npm run setup` ใหม่ ถ้าไม่มี `.env` จะสร้างให้
- **ข้อมูลเพี้ยน อยากเริ่มใหม่:** `npm run db:reset` แล้ว `npm run db:seed`
- **หน้าเว็บขึ้น error เรื่อง Prisma:** รัน `npx prisma generate`

## ขึ้นใช้งานจริง

ฐานข้อมูลตอนพัฒนาเป็น SQLite ก่อนขึ้นจริงให้เปลี่ยนเป็น PostgreSQL: แก้ `provider` ใน `shop/prisma/schema.prisma` เป็น `"postgresql"` ตั้ง `DATABASE_URL` เป็น Postgres แล้วรัน `npx prisma migrate deploy` (แนะนำ Vercel + Neon) และต้องตั้งค่า `AUTH_SECRET` ใหม่ รวมถึงคีย์ Stripe ของจริง

## โครงสร้างโปรเจกต์

```
shop/
  app/(store)/   หน้าร้านฝั่งลูกค้า (หน้าแรก, สินค้า, ตะกร้า, ชำระเงิน, บัญชี)
  app/admin/     แดชบอร์ดฝั่งผู้ขาย (ต้องเป็นบัญชี ADMIN)
  lib/delivery.ts  กติกาวัน-เวลาส่ง เวลาตัดรอบ โซน และคิวต่อวัน (มีเทสต์)
  lib/orders.ts    สร้างออเดอร์ จองคิว ยืนยันการชำระเงิน
  prisma/        schema, migration, ข้อมูลตัวอย่าง
```

แผนงาน 4 สัปดาห์ดูที่ [ROADMAP.md](ROADMAP.md)
