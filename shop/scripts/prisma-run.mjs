// เรียก Prisma CLI โดยเลือก schema ให้อัตโนมัติจาก DATABASE_URL
//   file:...       → prisma/schema.prisma           (SQLite สำหรับพัฒนาบนเครื่อง)
//   postgres://... → prisma/postgres/schema.prisma  (PostgreSQL สำหรับเซิร์ฟเวอร์จริง เช่น Render)
// ใช้: node scripts/prisma-run.mjs generate | migrate deploy | ...
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (existsSync(".env")) {
    const m = readFileSync(".env", "utf8").match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (m) return m[1];
  }
  return "file:./dev.db";
}

export const isPostgres = (url) => /^postgres(ql)?:\/\//.test(url);

const url = databaseUrl();
const schema = isPostgres(url) ? "prisma/postgres/schema.prisma" : "prisma/schema.prisma";
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("ใช้: node scripts/prisma-run.mjs <คำสั่ง prisma>");
  process.exit(1);
}

console.log(`[prisma] ${isPostgres(url) ? "PostgreSQL" : "SQLite"} → ${schema}`);
const res = spawnSync("npx", ["prisma", ...args, "--schema", schema], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, DATABASE_URL: url },
});
process.exit(res.status ?? 1);
