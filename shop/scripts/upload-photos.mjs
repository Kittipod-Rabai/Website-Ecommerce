// อัปโหลดรูปในโฟลเดอร์ public/photos ขึ้น Cloudinary (ทำครั้งเดียวก่อน deploy)
//   1) ใส่ CLOUDINARY_URL ในไฟล์ shop/.env  (cloudinary://API_KEY:API_SECRET@CLOUD_NAME)
//   2) npm run photos:upload            (อัปโหลดจริง)
//      npm run photos:upload -- --dry   (แค่แสดงว่าจะอัปโหลดอะไร ไม่ติดต่อ Cloudinary)
// อัปโหลดซ้ำได้ ไฟล์เดิมจะถูกเขียนทับ (public_id คงที่ = maison-fleur/seed/<ชื่อไฟล์>)
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const FOLDER = "maison-fleur/seed";
const DIR = "public/photos";
const dry = process.argv.includes("--dry");

function normalizeCloudinaryUrl(v) {
  return (v ?? "").trim().replace(/^["']|["']$/g, "").replace(/^CLOUDINARY_URL=/i, "").replace(/[<>]/g, "").trim();
}

function readCloudinaryUrl() {
  if (process.env.CLOUDINARY_URL) return normalizeCloudinaryUrl(process.env.CLOUDINARY_URL);
  if (existsSync(".env")) {
    const m = readFileSync(".env", "utf8").match(/^CLOUDINARY_URL=(.*)$/m);
    if (m) return normalizeCloudinaryUrl(m[1]);
  }
  return "";
}

const raw = readCloudinaryUrl();
const m = raw.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
if (!m && !dry) {
  console.error("ไม่พบ CLOUDINARY_URL ที่ถูกต้อง\nให้เพิ่มบรรทัดนี้ในไฟล์ shop/.env แล้วรันใหม่:\n  CLOUDINARY_URL=\"cloudinary://API_KEY:API_SECRET@CLOUD_NAME\"");
  process.exit(1);
}
const [, apiKey, apiSecret, cloudName] = m ?? [];

const files = readdirSync(DIR).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
console.log(`พบรูป ${files.length} ไฟล์ใน ${DIR}${dry ? " (โหมดทดลอง ไม่อัปโหลดจริง)" : ` → Cloudinary: ${cloudName}`}\n`);

let ok = 0;
const failed = [];
for (const file of files) {
  const name = path.parse(file).name;
  const publicId = `${FOLDER}/${name}`;
  if (dry) {
    console.log(`  ${file}  →  ${publicId}`);
    continue;
  }
  const timestamp = String(Math.floor(Date.now() / 1000));
  // ลายเซ็น: พารามิเตอร์ (ยกเว้น file/api_key) เรียงตามตัวอักษร ต่อด้วย api_secret แล้ว SHA-1
  const signature = createHash("sha1").update(`overwrite=true&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest("hex");
  const body = new FormData();
  body.set("file", new Blob([readFileSync(path.join(DIR, file))]), file);
  body.set("api_key", apiKey);
  body.set("timestamp", timestamp);
  body.set("public_id", publicId);
  body.set("overwrite", "true");
  body.set("signature", signature);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 403 && /missing permissions/i.test(text)) {
        console.error("
✘ API key นี้ไม่มีสิทธิ์อัปโหลด (create)
  แก้: Cloudinary Console → Settings → API Keys → ใช้ key ที่มีสิทธิ์ครบ (Root/Full access)
  หรือสร้าง key ใหม่ที่ติ๊กสิทธิ์ upload/create แล้วอัปเดต CLOUDINARY_URL ใน .env");
        process.exit(1);
      }
      throw new Error(`${res.status} ${text.slice(0, 120)}`);
    }
    ok++;
    console.log(`  ✔ ${file}`);
  } catch (e) {
    failed.push(file);
    console.log(`  ✘ ${file}  ${e instanceof Error ? e.message : e}`);
  }
}

if (dry) process.exit(0);
console.log(`\nสำเร็จ ${ok}/${files.length} ไฟล์${failed.length ? ` — ล้มเหลว: ${failed.join(", ")}` : ""}`);
if (ok > 0) console.log(`ตัวอย่างลิงก์: https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${FOLDER}/rose-bouquet`);
process.exit(failed.length ? 1 : 0);
