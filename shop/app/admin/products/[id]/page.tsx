import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { COLOR_TAGS, SIZES, saveProduct } from "@/lib/admin-products";
import { parseJson } from "@/lib/utils";
import { Card, PageHeader, adminInput, smallBtn, smallBtnOutline } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const metadata: Metadata = { title: "แก้ไขสินค้า" };

const label = "mb-1.5 block text-xs font-medium text-muted";

export default async function ProductEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const isNew = id === "new";

  const [product, categories, occasions] = await Promise.all([
    isNew ? null : db.product.findUnique({ where: { id }, include: { variants: true, occasions: true } }),
    db.category.findMany(),
    db.occasion.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!isNew && !product) notFound();

  const variant = (s: string) => product?.variants.find((v) => v.label === s);
  const photos = parseJson<string[]>(product?.images, []);
  const selectedOcc = new Set(product?.occasions.map((o) => o.occasionId));

  async function save(formData: FormData) {
    "use server";
    await requireAdmin(); // server actions are public endpoints: always re-check
    const res = await saveProduct(formData, isNew ? null : id);
    if (!res.ok) redirect(`/admin/products/${id}?error=${encodeURIComponent(res.error)}`);
    revalidatePath("/", "layout");
    redirect("/admin/products?saved=1");
  }

  async function remove() {
    "use server";
    await requireAdmin();
    await db.product.delete({ where: { id } }); // ออเดอร์เก่ายังเก็บชื่อ/ราคาไว้ใน snapshot
    revalidatePath("/", "layout");
    redirect("/admin/products?saved=1");
  }

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-block text-xs text-muted underline-offset-4 hover:underline">← สินค้าทั้งหมด</Link>
      <PageHeader title={isNew ? "เพิ่มสินค้าใหม่" : `แก้ไข: ${product!.name}`} />

      {error && <p role="alert" className="mb-6 rounded-2xl border border-accent bg-accent/5 px-4 py-3 text-sm text-accent">{error}</p>}

      <form action={save} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Card title="ข้อมูลสินค้า">
            <div className="space-y-4">
              <div>
                <label className={label} htmlFor="name">ชื่อสินค้า</label>
                <input id="name" name="name" required defaultValue={product?.name} className={adminInput} />
              </div>
              <div>
                <label className={label} htmlFor="description">รายละเอียด</label>
                <textarea id="description" name="description" required rows={4} defaultValue={product?.description} className={adminInput} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="categoryId">หมวด</label>
                  <select id="categoryId" name="categoryId" defaultValue={product?.categoryId} className={adminInput}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="colorTag">สีหลัก (ใช้กรองหน้าร้าน)</label>
                  <select id="colorTag" name="colorTag" defaultValue={product?.colorTag ?? "pink"} className={adminInput}>
                    {COLOR_TAGS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={label} htmlFor="flowerTypes">ชนิดดอกไม้ (คั่นด้วยจุลภาค)</label>
                <input id="flowerTypes" name="flowerTypes" defaultValue={parseJson<string[]>(product?.flowerTypes, []).join(", ")} placeholder="กุหลาบ, ไฮเดรนเยีย" className={adminInput} />
              </div>
              <fieldset>
                <legend className={label}>โอกาส</legend>
                <div className="flex flex-wrap gap-2">
                  {occasions.map((o) => (
                    <label key={o.id} className="flex cursor-pointer items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 text-sm has-[:checked]:border-accent has-[:checked]:bg-blush">
                      <input type="checkbox" name="occasions" value={o.id} defaultChecked={selectedOcc.has(o.id)} className="accent-[var(--accent)]" />
                      {o.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </Card>

          <Card title="ราคาและขนาด">
            <p className="mb-4 text-xs text-muted">กรอกราคาเป็นบาท เว้นว่างถ้าไม่มีขนาดนั้น (ต้องมีอย่างน้อย 1 ขนาด) และเวลาเตรียมช่อเป็นชั่วโมงก่อนส่ง</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {SIZES.map((s) => (
                <div key={s} className="rounded-2xl border border-[var(--line)] p-4">
                  <p className="display mb-3 text-xl">ขนาด {s}</p>
                  <label className={label} htmlFor={`price_${s}`}>ราคา (บาท)</label>
                  <input id={`price_${s}`} name={`price_${s}`} type="number" min={1} defaultValue={variant(s) ? variant(s)!.priceSatang / 100 : ""} className={adminInput} />
                  <label className={`${label} mt-3`} htmlFor={`lead_${s}`}>เตรียมช่อ (ชม.)</label>
                  <input id={`lead_${s}`} name={`lead_${s}`} type="number" min={1} max={72} defaultValue={variant(s)?.leadTimeHours ?? (s === "L" ? 6 : 4)} className={adminInput} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="รูปภาพ">
            <label className={label} htmlFor="photos">รูปปัจจุบัน (หนึ่งบรรทัดต่อหนึ่งรูป รูปแรกคือรูปหลัก)</label>
            <textarea id="photos" name="photos" rows={5} defaultValue={photos.join("\n")} className={`${adminInput} font-mono text-xs`} placeholder="/photos/rose-bouquet.jpg" />
            <label className={`${label} mt-4`} htmlFor="files">อัปโหลดรูปเพิ่ม (JPG/PNG/WEBP ไม่เกิน 4MB)</label>
            <input id="files" name="files" type="file" multiple accept="image/jpeg,image/png,image/webp" className="w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blush file:px-4 file:py-2 file:text-sm file:text-accent" />
            <p className="mt-3 text-xs text-muted">รูปที่อัปโหลดเก็บในโฟลเดอร์ public/uploads ของเซิร์ฟเวอร์ (ถ้าขึ้นระบบจริงแบบ serverless ควรใช้ที่เก็บรูปภายนอก เช่น Cloudinary)</p>
          </Card>

          <Card title="การแสดงผล">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="accent-[var(--accent)]" /> เปิดขายบนหน้าร้าน
            </label>
            <label className="mt-3 flex items-center gap-3 text-sm">
              <input type="checkbox" name="bestseller" defaultChecked={product?.bestseller ?? false} className="accent-[var(--accent)]" /> แสดงในช่อขายดีหน้าแรก
            </label>
          </Card>

          <div className="flex flex-wrap gap-3">
            <button className={smallBtn}>บันทึกสินค้า</button>
            <Link href="/admin/products" className={smallBtnOutline}>ยกเลิก</Link>
          </div>
        </div>
      </form>

      {!isNew && (
        <form action={remove} className="mt-12 border-t border-[var(--line)] pt-6">
          <ConfirmButton message="ลบสินค้านี้ถาวร? ออเดอร์เก่ายังเก็บประวัติไว้ แต่สินค้าจะหายจากหน้าร้านและตะกร้า" className="text-xs text-muted underline hover:text-accent">
            ลบสินค้านี้ถาวร
          </ConfirmButton>
          <p className="mt-1 text-xs text-muted">ถ้าแค่ต้องการหยุดขายชั่วคราว ให้ปิดการเปิดขายแทน</p>
        </form>
      )}
    </>
  );
}
