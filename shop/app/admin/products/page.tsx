import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { formatBaht } from "@/lib/money";
import { parseJson, cn } from "@/lib/utils";
import { PageHeader, smallBtn, smallBtnOutline } from "@/components/admin/ui";

export const metadata: Metadata = { title: "สินค้า" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string }> }) {
  const sp = await searchParams;
  const q = sp.q?.trim();
  const products = await db.product.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { slug: { contains: q.toLowerCase() } }] } : undefined,
    include: { category: true, variants: { orderBy: { priceSatang: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  async function toggle(formData: FormData) {
    "use server";
    await requireAdmin();
    const id = String(formData.get("id"));
    const field = String(formData.get("field"));
    if (field !== "active" && field !== "bestseller") return;
    const p = await db.product.findUnique({ where: { id } });
    if (!p) return;
    await db.product.update({ where: { id }, data: { [field]: !p[field] } });
    revalidatePath("/admin/products");
    revalidatePath("/", "layout");
  }

  return (
    <>
      <PageHeader title="สินค้า" sub={`${products.length} รายการ`}>
        <Link href="/admin/products/new" className={smallBtn}>+ เพิ่มสินค้า</Link>
      </PageHeader>

      {sp.saved && <p role="status" className="mb-6 rounded-2xl border border-[#9ccf9c] bg-[#eaf6ea] px-4 py-3 text-sm text-[#1f5a2a]">บันทึกสินค้าเรียบร้อย</p>}

      <form className="mb-6 flex max-w-md gap-2">
        <input name="q" defaultValue={q} placeholder="ค้นหาชื่อสินค้า" aria-label="ค้นหา" className="w-full rounded-full border border-[var(--line)] bg-snow px-5 py-2.5 text-sm outline-none focus:border-accent" />
        <button className={smallBtn}>ค้นหา</button>
      </form>

      <div className="overflow-x-auto rounded-3xl border border-[var(--line)] bg-snow">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-[var(--line)] text-xs text-muted">
            <tr>
              <th className="p-4 font-medium">สินค้า</th>
              <th className="font-medium">หมวด</th>
              <th className="font-medium">ราคา (S–L)</th>
              <th className="font-medium">ขายดี</th>
              <th className="font-medium">สถานะ</th>
              <th className="p-4 text-right font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {products.map((p) => {
              const img = parseJson<string[]>(p.images, [])[0];
              const lo = p.variants[0]?.priceSatang ?? 0;
              const hi = p.variants[p.variants.length - 1]?.priceSatang ?? 0;
              return (
                <tr key={p.id} className="hover:bg-paper-deep/50">
                  <td className="p-4">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                      <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-paper-deep">
                        {img && <Image src={img} alt="" fill sizes="48px" className="object-cover" />}
                      </span>
                      <span className="font-semibold underline-offset-4 hover:underline">{p.name}</span>
                    </Link>
                  </td>
                  <td>{p.category.name}</td>
                  <td className="tabular-nums">{formatBaht(lo)}{hi !== lo && ` – ${formatBaht(hi)}`}</td>
                  <td>
                    <form action={toggle}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="field" value="bestseller" />
                      <button className={cn("rounded-full px-3 py-1 text-xs", p.bestseller ? "bg-blush text-accent" : "bg-paper-deep text-muted")}>
                        {p.bestseller ? "★ ขายดี" : "ไม่ใช่"}
                      </button>
                    </form>
                  </td>
                  <td>
                    <form action={toggle}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="field" value="active" />
                      <button className={cn("rounded-full px-3 py-1 text-xs", p.active ? "bg-[#d6ecd6] text-[#1f5a2a]" : "bg-[#e5e1de] text-[#5d5654]")}>
                        {p.active ? "เปิดขาย" : "ปิดขาย"}
                      </button>
                    </form>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/products/${p.id}`} className={smallBtnOutline}>แก้ไข</Link>
                  </td>
                </tr>
              );
            })}
            {products.length === 0 && (
              <tr><td colSpan={6} className="p-12 text-center text-muted">ไม่พบสินค้า</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
