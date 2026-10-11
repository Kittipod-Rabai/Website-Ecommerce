import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/auth";
import { AuthShell, authInput } from "@/components/store/AuthShell";
import { Button } from "@/components/ui/Button";
import { rateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };
export const dynamic = "force-dynamic";

// Only allow same-site relative redirects.
const safeNext = (n?: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; registered?: string }> }) {
  const sp = await searchParams;
  const session = await auth();
  if (session?.user) redirect(safeNext(sp.next));

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").toLowerCase();
    const next = safeNext(String(formData.get("next") ?? ""));
    if (!(await rateLimit(`login:${email}`, 8, 10 * 60_000))) redirect(`/login?error=limit&next=${encodeURIComponent(next)}`);
    try {
      await signIn("credentials", { email, password: String(formData.get("password") ?? ""), redirectTo: next });
    } catch (e) {
      if (e instanceof AuthError) redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
      throw e; // NEXT_REDIRECT on success
    }
  }

  const error = sp.error === "limit" ? "พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอสักครู่" : sp.error ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง" : undefined;

  return (
    <AuthShell
      title="เข้าสู่ระบบ"
      subtitle={sp.registered ? "สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ" : "ดูประวัติออเดอร์และจัดการที่อยู่จัดส่งของคุณ"}
      error={error}
      footer={{ text: "ยังไม่มีบัญชี?", href: "/register", cta: "สมัครสมาชิก" }}
    >
      <form action={login} className="space-y-5">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <label className="block">
          <span className="eyebrow mb-2 block text-muted">อีเมล</span>
          <input name="email" type="email" required autoComplete="email" className={authInput} />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-muted">รหัสผ่าน</span>
          <input name="password" type="password" required autoComplete="current-password" className={authInput} />
        </label>
        <Button className="w-full">เข้าสู่ระบบ</Button>
      </form>
    </AuthShell>
  );
}
