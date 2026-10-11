// ตั้งค่าโปรเจกต์ครั้งแรกด้วยคำสั่งเดียว: npm run setup
// ทำงานได้ทั้ง Windows / macOS / Linux
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const run = (cmd) => {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", shell: true });
};

const major = Number(process.versions.node.split(".")[0]);
if (major < 20) {
  console.error(`ต้องใช้ Node.js เวอร์ชัน 20 ขึ้นไป (เครื่องนี้คือ ${process.versions.node}) ดาวน์โหลดได้ที่ https://nodejs.org`);
  process.exit(1);
}

// 1) สร้างไฟล์ .env จากตัวอย่าง พร้อมสุ่ม AUTH_SECRET ให้อัตโนมัติ
if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  const secret = randomBytes(32).toString("base64");
  const text = readFileSync(".env", "utf8").replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET="${secret}"`);
  writeFileSync(".env", text);
  console.log("สร้างไฟล์ .env แล้ว");
} else {
  console.log("พบไฟล์ .env อยู่แล้ว ข้ามขั้นตอนนี้");
}

// 2) สร้างฐานข้อมูล SQLite และข้อมูลตัวอย่าง
run("npx prisma generate");
run("npx prisma migrate deploy");
run("npx tsx prisma/seed.ts");

console.log(`
✔ ตั้งค่าเสร็จแล้ว
เริ่มรันเว็บ:   npm run dev
เปิดดูที่:      http://localhost:3000
บัญชีทดสอบ:    ดูในไฟล์ prisma/seed.ts (admin@maisonfleur.test)
`);
