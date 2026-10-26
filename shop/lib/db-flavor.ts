import { isPostgres } from "@/lib/db-url";

/**
 * ตัวกรองข้อความแบบ "มีคำนี้อยู่" ที่ไม่สนตัวพิมพ์เล็ก/ใหญ่
 * SQLite (เครื่องพัฒนา) ไม่สนตัวพิมพ์อยู่แล้ว ส่วน PostgreSQL ต้องระบุ mode: "insensitive"
 */
export function contains(value: string) {
  return isPostgres(process.env.DATABASE_URL ?? "") ? { contains: value, mode: "insensitive" as const } : { contains: value };
}
