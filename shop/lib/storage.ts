import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * เก็บรูปที่แอดมินอัปโหลด
 *  - ตั้ง CLOUDINARY_URL แล้ว → อัปโหลดขึ้น Cloudinary (ใช้บน Render / เซิร์ฟเวอร์จริง)
 *  - ไม่ได้ตั้ง (เครื่องพัฒนา) → เก็บในโฟลเดอร์ public/uploads
 *  - ไม่ได้ตั้งแต่เป็น production → ปฏิเสธ เพราะดิสก์ของ Render จะถูกล้างทุกครั้งที่ deploy
 */
export const MAX_UPLOAD = 4 * 1024 * 1024;
const ALLOWED_EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const CLOUDINARY_HOST = "https://res.cloudinary.com/";

function cloudinaryConfig() {
  const raw = process.env.CLOUDINARY_URL; // cloudinary://<api_key>:<api_secret>@<cloud_name>
  if (!raw) return null;
  const m = raw.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) throw new Error("รูปแบบ CLOUDINARY_URL ไม่ถูกต้อง (ต้องเป็น cloudinary://API_KEY:API_SECRET@CLOUD_NAME)");
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
}

async function uploadToCloudinary(file: File, cfg: NonNullable<ReturnType<typeof cloudinaryConfig>>): Promise<string> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const folder = "maison-fleur";
  // ลายเซ็น: พารามิเตอร์เรียงตามตัวอักษร ต่อด้วย api_secret แล้ว SHA-1
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${cfg.apiSecret}`).digest("hex");

  const body = new FormData();
  body.set("file", file);
  body.set("api_key", cfg.apiKey);
  body.set("timestamp", timestamp);
  body.set("folder", folder);
  body.set("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`, { method: "POST", body });
  if (!res.ok) {
    console.error("Cloudinary upload failed", res.status, await res.text().catch(() => ""));
    throw new Error("อัปโหลดรูปไปยัง Cloudinary ไม่สำเร็จ ตรวจสอบค่า CLOUDINARY_URL");
  }
  const json = (await res.json()) as { secure_url?: string };
  if (!json.secure_url?.startsWith(CLOUDINARY_HOST)) throw new Error("Cloudinary ตอบกลับไม่ถูกต้อง");
  return json.secure_url;
}

/** บันทึกรูปที่อัปโหลด แล้วคืนที่อยู่รูป (URL เต็มของ Cloudinary หรือ path ใน /uploads) */
export async function saveImage(file: File): Promise<string> {
  const ext = ALLOWED_EXT[file.type];
  if (!ext) throw new Error("รองรับเฉพาะไฟล์ JPG, PNG หรือ WEBP");
  if (file.size > MAX_UPLOAD) throw new Error("ไฟล์ใหญ่เกิน 4MB");

  const cfg = cloudinaryConfig();
  if (cfg) return uploadToCloudinary(file, cfg);

  if (process.env.NODE_ENV === "production") {
    throw new Error("ยังไม่ได้ตั้งค่า CLOUDINARY_URL จึงอัปโหลดรูปบนเซิร์ฟเวอร์จริงไม่ได้");
  }
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}
