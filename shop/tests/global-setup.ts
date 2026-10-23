import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

const dbFile = path.join(process.cwd(), "prisma", "test.db");

/** สร้างฐานข้อมูลทดสอบใหม่ทุกครั้งที่รัน `npm test` */
export default function setup() {
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
