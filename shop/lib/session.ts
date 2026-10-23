import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/**
 * ต้องเป็นแอดมินเท่านั้น ตรวจบทบาทจากฐานข้อมูลทุกครั้ง (ไม่เชื่อ role ใน token)
 * เพื่อให้การถอนสิทธิ์แอดมินมีผลทันที
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?next=/admin");
  const row = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!row) redirect("/login?next=/admin");
  if (row.role !== "ADMIN") redirect("/");
  return { ...session.user, role: "ADMIN" as const };
}
