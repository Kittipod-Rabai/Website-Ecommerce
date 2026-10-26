import path from "node:path";
import { defineConfig } from "vitest/config";

// ค่าเริ่มต้น: ฐานข้อมูล SQLite แยก (prisma/test.db) ไม่แตะข้อมูลจริง
// ทดสอบกับ PostgreSQL: ตั้ง TEST_DATABASE_URL=postgresql://... (ใช้ฐานข้อมูลที่สร้างไว้ทดสอบโดยเฉพาะ เพราะเทสต์จะลบข้อมูลในตารางทั้งหมดก่อนเริ่ม!)
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "file:./test.db" },
    globalSetup: ["./tests/global-setup.ts"],
    fileParallelism: false,
  },
});
