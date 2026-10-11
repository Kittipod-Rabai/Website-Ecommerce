import type { Metadata } from "next";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { AuthShell, authInput } from "@/components/store/AuthShell";
import { Button } from "@/components/ui/Button";
import { rateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "สมัครสมาชิก" };
export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
});

const ERRORS: Record<string, string> = {
  invalid: "กรุณากรอกชื่อ อีเมลที่ถูกต้อง และรหัสผ่านอย่างน้อย 8 ตัวอักษร",
  exists: "อีเมลนี้ถูกใช้งานแล้ว",
  limit: "ทำรายการบ่อยเกินไป กรุณารอสักครู่",
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  async function register(formData: FormData) {
    "use server";
    if (!(await rateLimit("register", 20, 10 * 60_000))) redirect("/register?error=limit");
    const parsed = schema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) redirect("/register?error=invalid");
    const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
    if (exists) redirect("/register?error=exists");
    await db.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await bcrypt.hash(parsed.data.password, 10) },
    });
    redirect("/login?registered=1");
  }

  return (
    <AuthShell
      title="สมัครสมาชิก"
      subtitle="สั่งซ้ำง่าย ติดตามออเดอร์ และบันทึกที่อยู่ผู้รับ"
      error={error ? (ERRORS[error] ?? ERRORS.invalid) : undefined}
      footer={{ text: "มีบัญชีแล้ว?", href: "/login", cta: "เข้าสู่ระบบ" }}
    >
      <form action={register} className="space-y-5">
        <label className="block">
          <span className="eyebrow mb-2 block text-muted">ชื่อ</span>
          <input name="name" required autoComplete="name" className={authInput} />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-muted">อีเมล</span>
          <input name="email" type="email" required autoComplete="email" className={authInput} />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-muted">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className={authInput} />
        </label>
        <Button className="w-full">สมัครสมาชิก</Button>
      </form>
    </AuthShell>
  );
}
