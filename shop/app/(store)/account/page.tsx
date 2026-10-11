import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { signOut } from "@/auth";
import { formatBaht } from "@/lib/money";
import { Button } from "@/components/ui/Button";
import { authInput } from "@/components/store/AuthShell";

export const metadata: Metadata = { title: "บัญชีของฉัน" };
export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PREPARING: "กำลังจัดช่อ",
  OUT_FOR_DELIVERY: "กำลังจัดส่ง",
  DELIVERED: "ส่งถึงแล้ว",
  CANCELLED: "ยกเลิก",
  REFUNDED: "คืนเงินแล้ว",
};

const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(80),
  phone: z.string().regex(/^0\d{8,9}$/),
  line1: z.string().trim().min(5).max(200),
  district: z.string().trim().min(2).max(80),
  province: z.string().trim().min(2).max(80),
  postcode: z.string().regex(/^\d{5}$/),
});

export default async function AccountPage() {
  const user = await requireUser();
  const [me, orders, addresses] = await Promise.all([
    db.user.findUnique({ where: { id: user.id } }),
    db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50, include: { items: true } }),
    db.savedAddress.findMany({ where: { userId: user.id } }),
  ]);

  async function updateProfile(formData: FormData) {
    "use server";
    const u = await requireUser();
    const name = z.string().trim().min(2).max(80).safeParse(formData.get("name"));
    if (name.success) await db.user.update({ where: { id: u.id }, data: { name: name.data } });
    revalidatePath("/account");
  }

  async function addAddress(formData: FormData) {
    "use server";
    const u = await requireUser();
    const parsed = addressSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return;
    await db.savedAddress.create({ data: { ...parsed.data, userId: u.id } });
    revalidatePath("/account");
  }

  async function deleteAddress(formData: FormData) {
    "use server";
    const u = await requireUser();
    // deleteMany scoped by userId so users can only delete their own addresses
    await db.savedAddress.deleteMany({ where: { id: String(formData.get("id")), userId: u.id } });
    revalidatePath("/account");
  }

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="container-x pb-28 pt-32">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3 text-accent">บัญชีของฉัน</p>
          <h1 className="display text-5xl lg:text-7xl">สวัสดี {me?.name ?? "คุณลูกค้า"}</h1>
        </div>
        <form action={logout}>
          <Button variant="outline">ออกจากระบบ</Button>
        </form>
      </div>

      <div className="grid gap-16 lg:grid-cols-[1.5fr_1fr]">
        <section>
          <h2 className="display mb-6 text-3xl">ประวัติออเดอร์</h2>
          {orders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[var(--line)] px-6 py-12 text-center text-sm text-muted">
              ยังไม่มีออเดอร์ <Link href="/flowers" className="underline underline-offset-4">เลือกช่อดอกไม้</Link>
            </p>
          ) : (
            <ul className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.number}`} className="flex items-center justify-between gap-4 py-5 transition-colors hover:bg-paper-deep/60 sm:px-3">
                    <div>
                      <p className="font-semibold">{o.number}</p>
                      <p className="text-sm text-muted">
                        {o.items.map((i) => i.nameSnapshot).join(", ")} · ส่ง {o.deliveryDate}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="tabular-nums">{formatBaht(o.total)}</p>
                      <p className="text-xs text-muted">{STATUS[o.status]}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-14">
          <section>
            <h2 className="display mb-6 text-3xl">โปรไฟล์</h2>
            <form action={updateProfile} className="space-y-4">
              <p className="text-sm text-muted">{me?.email}</p>
              <input name="name" defaultValue={me?.name ?? ""} className={authInput} aria-label="ชื่อ" />
              <Button variant="outline">บันทึก</Button>
            </form>
          </section>

          <section>
            <h2 className="display mb-6 text-3xl">ที่อยู่ผู้รับที่บันทึกไว้</h2>
            <ul className="mb-8 space-y-3">
              {addresses.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 border border-[var(--line)] p-4 text-sm">
                  <div>
                    <p className="font-semibold">{a.recipientName} · {a.phone}</p>
                    <p className="text-muted">{a.line1} {a.district} {a.province} {a.postcode}</p>
                  </div>
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-muted underline hover:text-accent">ลบ</button>
                  </form>
                </li>
              ))}
            </ul>
            <form action={addAddress} className="grid gap-3 sm:grid-cols-2">
              <input name="recipientName" placeholder="ชื่อผู้รับ" required className={authInput} />
              <input name="phone" placeholder="เบอร์โทร 0812345678" required className={authInput} />
              <input name="line1" placeholder="บ้านเลขที่ ซอย ถนน" required className={`${authInput} sm:col-span-2`} />
              <input name="district" placeholder="เขต/อำเภอ" required className={authInput} />
              <input name="province" placeholder="จังหวัด" required className={authInput} />
              <input name="postcode" placeholder="รหัสไปรษณีย์" required maxLength={5} className={authInput} />
              <Button variant="outline" className="sm:col-span-2">เพิ่มที่อยู่</Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
