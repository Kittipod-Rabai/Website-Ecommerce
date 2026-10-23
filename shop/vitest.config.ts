import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    // เทสต์ที่ต้องใช้ฐานข้อมูลจะใช้ไฟล์ SQLite แยก (prisma/test.db) ไม่แตะข้อมูลจริง
    env: { DATABASE_URL: "file:./test.db" },
    globalSetup: ["./tests/global-setup.ts"],
    fileParallelism: false,
  },
});
