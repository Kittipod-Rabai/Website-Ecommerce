import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { AdminNav } from "@/components/admin/AdminNav";
import { signOut } from "@/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-paper-deep lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="admin-aside on-dark bg-forest-deep text-snow lg:sticky lg:top-0 lg:h-screen">
        <div className="flex h-full flex-col px-6 py-8">
          <p className="display text-3xl">
            Maison Fleur
          </p>
          <p className="mt-1 text-xs text-snow/50">ระบบจัดการร้าน</p>
          <AdminNav />
          <div className="mt-auto hidden space-y-3 pt-8 text-sm lg:block">
            <p className="truncate text-snow/50">{user.email}</p>
            <form action={logout}>
              <button className="text-xs text-snow/70 underline underline-offset-4 hover:text-snow">ออกจากระบบ</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-5 py-8 sm:px-10 lg:py-12">{children}</div>
    </div>
  );
}
