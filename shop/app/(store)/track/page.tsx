import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "ติดตามออเดอร์" };
export const dynamic = "force-dynamic";

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  async function lookup(formData: FormData) {
    "use server";
    const number = String(formData.get("number") ?? "").trim().toUpperCase();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const order = number && email ? await db.order.findUnique({ where: { number } }) : null;
    // Same response for "no such order" and "wrong email" so numbers can't be probed.
    if (!order || order.buyerEmail !== email) redirect("/track?error=1");
    redirect(`/order/${order.number}`);
  }

  return (
    <div className="container-x flex min-h-[80vh] items-center justify-center pb-20 pt-32">
      <form action={lookup} className="w-full max-w-md space-y-6">
        <h1 className="display text-5xl">ติดตามออเดอร์</h1>
        <p className="text-sm text-muted">กรอกเลขออเดอร์และอีเมลที่ใช้สั่งซื้อ</p>
        {error && (
          <p role="alert" className="rounded-2xl border border-accent bg-accent/5 px-4 py-3 text-sm text-accent">
            ไม่พบออเดอร์ กรุณาตรวจสอบเลขออเดอร์และอีเมล
          </p>
        )}
        <label className="block">
          <span className="eyebrow mb-2 block text-muted">เลขออเดอร์</span>
          <input name="number" required placeholder="MF1A2B3C4D5E" className="w-full rounded-2xl border border-[var(--line)] bg-snow/60 px-4 py-3 text-sm uppercase outline-none focus:border-ink" />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-muted">อีเมล</span>
          <input name="email" type="email" required className="w-full rounded-2xl border border-[var(--line)] bg-snow/60 px-4 py-3 text-sm outline-none focus:border-ink" />
        </label>
        <Button className="w-full">ค้นหา</Button>
      </form>
    </div>
  );
}
