import type { Metadata } from "next";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { Card, PageHeader, adminInput, smallBtn, smallBtnOutline } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const metadata: Metadata = { title: "บัญชีแอดมิน" };

const MSG: Record<string, { ok: boolean; text: string }> = {
  pw_ok: { ok: true, text: "เปลี่ยนรหัสผ่านเรียบร้อย" },
  pw_bad: { ok: false, text: "รหัสผ่านปัจจุบันไม่ถูกต้อง" },
  pw_weak: { ok: false, text: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร และต้องตรงกันทั้งสองช่อง" },
  limit: { ok: false, text: "ลองหลายครั้งเกินไป กรุณารอสักครู่" },
  add_ok: { ok: true, text: "เพิ่มแอดมินเรียบร้อย" },
  add_bad: { ok: false, text: "กรุณากรอกอีเมลให้ถูกต้อง (และรหัสผ่านอย่างน้อย 8 ตัวอักษรถ้าเป็นบัญชีใหม่)" },
  rm_ok: { ok: true, text: "ถอนสิทธิ์แอดมินเรียบร้อย" },
  rm_self: { ok: false, text: "ไม่สามารถถอนสิทธิ์ตัวเองได้" },
};

export default async function AdminSettings({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const me = await requireAdmin();
  const { m } = await searchParams;
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  const notice = m ? MSG[m] : undefined;

  async function changePassword(fd: FormData) {
    "use server";
    const u = await requireAdmin();
    if (!(await rateLimit(`pw:${u.id}`, 5, 10 * 60_000))) redirect("/admin/settings?m=limit");
    const p = z
      .object({ current: z.string().min(1), next: z.string().min(8).max(100), confirm: z.string() })
      .refine((v) => v.next === v.confirm)
      .safeParse({ current: fd.get("current"), next: fd.get("next"), confirm: fd.get("confirm") });
    if (!p.success) redirect("/admin/settings?m=pw_weak");
    const row = await db.user.findUnique({ where: { id: u.id } });
    if (!row?.passwordHash || !(await bcrypt.compare(p.data.current, row.passwordHash))) redirect("/admin/settings?m=pw_bad");
    await db.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(p.data.next, 10) } });
    redirect("/admin/settings?m=pw_ok");
  }

  async function addAdmin(fd: FormData) {
    "use server";
    const u = await requireAdmin();
    if (!(await rateLimit(`addadmin:${u.id}`, 10, 10 * 60_000))) redirect("/admin/settings?m=limit");
    const p = z.object({ email: z.string().trim().toLowerCase().email(), name: z.string().trim().max(80).optional(), password: z.string().max(100).optional() }).safeParse({
      email: fd.get("email"),
      name: fd.get("name") || undefined,
      password: fd.get("password") || undefined,
    });
    if (!p.success) redirect("/admin/settings?m=add_bad");
    const existing = await db.user.findUnique({ where: { email: p.data.email } });
    if (existing) {
      await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } }); // เลื่อนสมาชิกเดิมเป็นแอดมิน
    } else {
      if (!p.data.password || p.data.password.length < 8) redirect("/admin/settings?m=add_bad");
      await db.user.create({
        data: { email: p.data.email, name: p.data.name ?? null, role: "ADMIN", passwordHash: await bcrypt.hash(p.data.password, 10) },
      });
    }
    redirect("/admin/settings?m=add_ok");
  }

  async function removeAdmin(fd: FormData) {
    "use server";
    const u = await requireAdmin();
    const id = String(fd.get("id"));
    if (id === u.id) redirect("/admin/settings?m=rm_self");
    await db.user.update({ where: { id }, data: { role: "CUSTOMER" } });
    redirect("/admin/settings?m=rm_ok");
  }

  const lbl = "mb-1.5 block text-xs font-medium text-muted";

  return (
    <>
      <PageHeader title="บัญชีแอดมิน" sub={`เข้าสู่ระบบในชื่อ ${me.email}`} />
      {notice && (
        <p role={notice.ok ? "status" : "alert"} className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${notice.ok ? "border-[#9ccf9c] bg-[#eaf6ea] text-[#1f5a2a]" : "border-accent bg-accent/5 text-accent"}`}>
          {notice.text}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="เปลี่ยนรหัสผ่านของฉัน">
          <form action={changePassword} className="space-y-4">
            <div><label className={lbl} htmlFor="current">รหัสผ่านปัจจุบัน</label><input id="current" name="current" type="password" required autoComplete="current-password" className={adminInput} /></div>
            <div><label className={lbl} htmlFor="next">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</label><input id="next" name="next" type="password" required minLength={8} autoComplete="new-password" className={adminInput} /></div>
            <div><label className={lbl} htmlFor="confirm">ยืนยันรหัสผ่านใหม่</label><input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className={adminInput} /></div>
            <button className={smallBtn}>เปลี่ยนรหัสผ่าน</button>
          </form>
        </Card>

        <Card title="ผู้ดูแลระบบทั้งหมด">
          <ul className="mb-6 divide-y divide-[var(--line)] text-sm">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{a.name ?? a.email}{a.id === me.id && <span className="ml-2 rounded-full bg-blush px-2 py-0.5 text-xs text-accent">คุณ</span>}</p>
                  <p className="text-xs text-muted">{a.email}</p>
                </div>
                {a.id !== me.id && (
                  <form action={removeAdmin}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmButton message={`ถอนสิทธิ์แอดมินของ ${a.email}?`} className={smallBtnOutline}>ถอนสิทธิ์</ConfirmButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <form action={addAdmin} className="space-y-3 border-t border-[var(--line)] pt-5">
            <p className="text-sm font-medium">เพิ่มแอดมินใหม่</p>
            <p className="text-xs text-muted">ถ้าอีเมลเป็นสมาชิกอยู่แล้ว จะเลื่อนเป็นแอดมินทันที (ไม่ต้องใส่รหัสผ่าน) ถ้าเป็นอีเมลใหม่ ให้ตั้งรหัสผ่านเริ่มต้นให้ด้วย</p>
            <input name="email" type="email" required placeholder="อีเมล" aria-label="อีเมล" className={adminInput} />
            <input name="name" placeholder="ชื่อ (ไม่บังคับ)" aria-label="ชื่อ" className={adminInput} />
            <input name="password" type="password" minLength={8} placeholder="รหัสผ่านเริ่มต้น (เฉพาะบัญชีใหม่)" aria-label="รหัสผ่านเริ่มต้น" autoComplete="new-password" className={adminInput} />
            <button className={smallBtn}>เพิ่มแอดมิน</button>
          </form>
        </Card>
      </div>
    </>
  );
}
