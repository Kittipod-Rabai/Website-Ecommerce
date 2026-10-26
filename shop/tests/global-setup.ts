import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const pgUrl = process.env.TEST_DATABASE_URL;
const dbFile = path.join(process.cwd(), "prisma", "test.db");

/** เตรียมฐานข้อมูลทดสอบใหม่ทุกครั้งที่รัน `npm test` */
export default function setup() {
  if (pgUrl) {
    // PostgreSQL: แค่ให้ตารางตรงกับ migration ล่าสุด (ตัวเทสต์จะลบข้อมูลของตัวเองเองก่อนเริ่ม)
    execSync("node scripts/prisma-run.mjs migrate deploy", {
      stdio: "ignore",
      env: { ...process.env, DATABASE_URL: pgUrl },
    });
    return;
  }
  rmSync(dbFile, { force: true });
  rmSync(`${dbFile}-journal`, { force: true });
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
  return () => {
    rmSync(dbFile, { force: true });
    rmSync(`${dbFile}-journal`, { force: true });
  };
}
