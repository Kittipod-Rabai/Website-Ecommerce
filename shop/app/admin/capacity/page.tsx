import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/session";
import { addDays, bangkokParts } from "@/lib/delivery";
import { getSettings } from "@/lib/orders";
import { formatBaht } from "@/lib/money";
import { parseJson } from "@/lib/utils";
import { thaiDate } from "@/lib/status";
import { Card, PageHeader, adminInput, smallBtn, smallBtnOutline } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

export const metadata: Metadata = { title: "คิวและโซนจัดส่ง" };

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "เวลาไม่ถูกต้อง");
const intField = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const lbl = "mb-1 block text-xs text-muted";
const refresh = () => revalidatePath("/admin/capacity");

export default async function CapacityPage({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const sp = await searchParams;
  const today = bangkokParts(new Date()).date;
  const days = Array.from({ length: 21 }, (_, i) => addDays(today, i));

  const [settings, caps, zones, slots, addOns] = await Promise.all([
    getSettings(),
    db.dailyCapacity.findMany({ where: { date: { gte: days[0], lte: days[20] } } }),
    db.deliveryZone.findMany(),
    db.deliverySlot.findMany({ orderBy: { startTime: "asc" }, include: { _count: { select: { orders: true } } } }),
    db.addOn.findMany(),
  ]);

  // ---------- server actions (ตรวจสิทธิ์แอดมินทุกครั้ง) ----------
  async function saveSettings(fd: FormData) {
    "use server";
    await requireAdmin();
    const p = z
      .object({ cap: intField(1, 500), free: intField(0, 1_000_000), low: intField(0, 100) })
      .safeParse({ cap: fd.get("cap"), free: fd.get("free"), low: fd.get("low") });
    if (!p.success) return;
    const rows = [
      ["defaultDailyCapacity", String(p.data.cap)],
      ["freeShippingOverSatang", String(p.data.free * 100)],
      ["lowCapacityThreshold", String(p.data.low)],
    ];
    for (const [key, value] of rows) await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
    refresh();
  }

  async function saveDay(fd: FormData) {
    "use server";
    await requireAdmin();
    const p = z
      .object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), max: intField(0, 500) })
      .safeParse({ date: fd.get("date"), max: fd.get("max") });
    if (!p.success) return;
    const closed = fd.get("closed") === "on";
    await db.dailyCapacity.upsert({
      where: { date: p.data.date },
      update: { maxOrders: p.data.max, closed },
      create: { date: p.data.date, maxOrders: p.data.max, closed },
    });
    refresh();
  }

  async function saveZone(fd: FormData) {
    "use server";
    await requireAdmin();
    const p = z
      .object({
        id: z.string().optional(),
        name: z.string().trim().min(2).max(100),
        postcodes: z.string().max(500),
        fee: intField(0, 100_000),
        cutoff: hhmm,
      })
      .safeParse(Object.fromEntries(fd));
    if (!p.success) return;
    const postcodes = p.data.postcodes.split(",").map((s) => s.trim()).filter((s) => /^\d{2,5}$/.test(s));
    if (postcodes.length === 0) return;
    const data = { name: p.data.name, postcodes: JSON.stringify(postcodes), feeSatang: p.data.fee * 100, sameDayCutoff: p.data.cutoff };
    if (p.data.id) await db.deliveryZone.update({ where: { id: p.data.id }, data });
    else await db.deliveryZone.create({ data });
    refresh();
  }

  async function deleteZone(fd: FormData) {
    "use server";
    await requireAdmin();
    await db.deliveryZone.delete({ where: { id: String(fd.get("id")) } });
    refresh();
  }

  async function saveSlot(fd: FormData) {
    "use server";
    await requireAdmin();
    const p = z
      .object({ id: z.string().optional(), label: z.string().trim().min(3).max(40), start: hhmm, end: hhmm })
      .safeParse(Object.fromEntries(fd));
    if (!p.success || p.data.start >= p.data.end) return;
    const data = { label: p.data.label, startTime: p.data.start, endTime: p.data.end };
    if (p.data.id) await db.deliverySlot.update({ where: { id: p.data.id }, data });
    else await db.deliverySlot.create({ data });
    refresh();
  }

  async function deleteSlot(fd: FormData) {
    "use server";
    await requireAdmin();
    const id = String(fd.get("id"));
    // ช่วงเวลาที่มีออเดอร์อ้างอิงอยู่ ห้ามลบ
    if ((await db.order.count({ where: { deliverySlotId: id } })) > 0) return;
    await db.deliverySlot.delete({ where: { id } });
    refresh();
  }

  async function saveAddOn(fd: FormData) {
    "use server";
    await requireAdmin();
    const p = z
      .object({ id: z.string().optional(), name: z.string().trim().min(2).max(60), price: intField(0, 100_000) })
      .safeParse(Object.fromEntries(fd));
    if (!p.success) return;
    const data = { name: p.data.name, priceSatang: p.data.price * 100, active: fd.get("active") === "on" };
    if (p.data.id) await db.addOn.update({ where: { id: p.data.id }, data });
    else await db.addOn.create({ data: { ...data, active: true } });
    refresh();
    revalidatePath("/", "layout");
  }

  async function deleteAddOn(fd: FormData) {
    "use server";
    await requireAdmin();
    await db.addOn.delete({ where: { id: String(fd.get("id")) } });
    refresh();
  }

  return (
    <>
      <PageHeader title="คิวและโซนจัดส่ง" sub="กำหนดจำนวนออเดอร์ต่อวัน วันหยุด โซนและค่าส่ง ช่วงเวลาจัดส่ง และของเสริม" />

      <div className="space-y-6">
        <Card title="ตั้งค่าทั่วไป">
          <form action={saveSettings} className="grid items-end gap-4 sm:grid-cols-4">
            <div>
              <label className={lbl} htmlFor="cap">คิวต่อวัน (ออเดอร์)</label>
              <input id="cap" name="cap" type="number" min={1} defaultValue={settings.defaultCapacity} className={adminInput} />
            </div>
            <div>
              <label className={lbl} htmlFor="free">ส่งฟรีเมื่อซื้อครบ (บาท, 0 = ไม่มี)</label>
              <input id="free" name="free" type="number" min={0} defaultValue={settings.freeOverSatang / 100} className={adminInput} />
            </div>
            <div>
              <label className={lbl} htmlFor="low">เตือนเมื่อคิวเหลือ (ออเดอร์)</label>
              <input id="low" name="low" type="number" min={0} defaultValue={settings.lowCapacityThreshold} className={adminInput} />
            </div>
            <button className={smallBtn}>บันทึก</button>
          </form>
        </Card>

        <Card title="คิวรายวัน (21 วันข้างหน้า)">
          <p className="mb-4 text-xs text-muted">ปรับจำนวนคิวของวันใดวันหนึ่ง หรือติ๊ก &ldquo;ปิดรับ&rdquo; สำหรับวันหยุดร้าน (ลูกค้าจะเลือกวันนั้นไม่ได้)</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr><th className="pb-3 font-medium">วันที่</th><th className="pb-3 font-medium">ใช้ไปแล้ว</th><th className="pb-3 font-medium">คิวสูงสุด</th><th className="pb-3 font-medium">ปิดรับ</th><th /></tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {days.map((date) => {
                  const c = caps.find((x) => x.date === date);
                  return (
                    <tr key={date}>
                      <td className="py-2.5">{thaiDate(date, true)}</td>
                      <td className="tabular-nums">{c?.usedOrders ?? 0}</td>
                      <td colSpan={3}>
                        <form action={saveDay} className="flex items-center gap-4">
                          <input type="hidden" name="date" value={date} />
                          <input name="max" type="number" min={0} aria-label={`คิวสูงสุด ${date}`} defaultValue={c?.maxOrders ?? settings.defaultCapacity} className={`${adminInput} w-24 py-1.5`} />
                          <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="closed" defaultChecked={c?.closed} className="accent-[var(--accent)]" /> ปิดรับ</label>
                          <button className={smallBtnOutline}>บันทึก</button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="โซนจัดส่งและค่าส่ง">
          <p className="mb-4 text-xs text-muted">จับคู่ด้วยรหัสไปรษณีย์ขึ้นต้น (เช่น 10 = กรุงเทพฯ, 10270 = เจาะจงรหัสเดียว) ระบบเลือกรหัสที่ตรงยาวที่สุด</p>
          <div className="space-y-4">
            {zones.map((z) => (
              <div key={z.id} className="rounded-2xl border border-[var(--line)] p-4">
                <form action={saveZone} className="grid items-end gap-3 lg:grid-cols-[1.4fr_1.6fr_0.7fr_0.7fr_auto]">
                  <input type="hidden" name="id" value={z.id} />
                  <div><label className={lbl}>ชื่อโซน</label><input name="name" defaultValue={z.name} className={adminInput} /></div>
                  <div><label className={lbl}>รหัสไปรษณีย์ขึ้นต้น (คั่นด้วยจุลภาค)</label><input name="postcodes" defaultValue={parseJson<string[]>(z.postcodes, []).join(", ")} className={adminInput} /></div>
                  <div><label className={lbl}>ค่าส่ง (บาท)</label><input name="fee" type="number" min={0} defaultValue={z.feeSatang / 100} className={adminInput} /></div>
                  <div><label className={lbl}>ตัดรอบวันนี้</label><input name="cutoff" defaultValue={z.sameDayCutoff} placeholder="14:00" className={adminInput} /></div>
                  <button className={smallBtn}>บันทึก</button>
                </form>
                <form action={deleteZone} className="mt-2">
                  <input type="hidden" name="id" value={z.id} />
                  <ConfirmButton message={`ลบโซน "${z.name}"? ลูกค้าในพื้นที่นี้จะสั่งซื้อไม่ได้`} className="text-xs text-muted underline hover:text-accent">ลบโซนนี้</ConfirmButton>
                </form>
              </div>
            ))}
            <form action={saveZone} className="grid items-end gap-3 rounded-2xl border border-dashed border-[var(--line)] p-4 lg:grid-cols-[1.4fr_1.6fr_0.7fr_0.7fr_auto]">
              <div><label className={lbl}>เพิ่มโซนใหม่</label><input name="name" placeholder="ชื่อโซน" required className={adminInput} /></div>
              <div><label className={lbl}>รหัสไปรษณีย์ขึ้นต้น</label><input name="postcodes" placeholder="50, 51" required className={adminInput} /></div>
              <div><label className={lbl}>ค่าส่ง (บาท)</label><input name="fee" type="number" min={0} defaultValue={150} className={adminInput} /></div>
              <div><label className={lbl}>ตัดรอบวันนี้</label><input name="cutoff" defaultValue="12:00" className={adminInput} /></div>
              <button className={smallBtn}>เพิ่ม</button>
            </form>
          </div>
        </Card>

        <Card title="ช่วงเวลาจัดส่ง">
          <div className="space-y-3">
            {slots.map((s) => (
              <div key={s.id} className="flex flex-wrap items-end gap-3">
                <form action={saveSlot} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={s.id} />
                  <div><label className={lbl}>ชื่อที่แสดง</label><input name="label" defaultValue={s.label} className={`${adminInput} w-44`} /></div>
                  <div><label className={lbl}>เริ่ม</label><input name="start" defaultValue={s.startTime} className={`${adminInput} w-24`} /></div>
                  <div><label className={lbl}>สิ้นสุด</label><input name="end" defaultValue={s.endTime} className={`${adminInput} w-24`} /></div>
                  <button className={smallBtnOutline}>บันทึก</button>
                </form>
                {s._count.orders === 0 ? (
                  <form action={deleteSlot}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton message="ลบช่วงเวลานี้?" className="pb-2 text-xs text-muted underline hover:text-accent">ลบ</ConfirmButton>
                  </form>
                ) : (
                  <span className="pb-2 text-xs text-muted">มี {s._count.orders} ออเดอร์ใช้อยู่ ลบไม่ได้</span>
                )}
              </div>
            ))}
            <form action={saveSlot} className="flex flex-wrap items-end gap-3 border-t border-[var(--line)] pt-4">
              <div><label className={lbl}>เพิ่มช่วงเวลา</label><input name="label" placeholder="18:00 – 20:00" required className={`${adminInput} w-44`} /></div>
              <div><label className={lbl}>เริ่ม</label><input name="start" defaultValue="18:00" className={`${adminInput} w-24`} /></div>
              <div><label className={lbl}>สิ้นสุด</label><input name="end" defaultValue="20:00" className={`${adminInput} w-24`} /></div>
              <button className={smallBtn}>เพิ่ม</button>
            </form>
          </div>
        </Card>

        <Card title="ของเสริม (add-on)">
          <div className="space-y-3">
            {addOns.map((a) => (
              <div key={a.id} className="flex flex-wrap items-end gap-3">
                <form action={saveAddOn} className="flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={a.id} />
                  <div><label className={lbl}>ชื่อ</label><input name="name" defaultValue={a.name} className={`${adminInput} w-56`} /></div>
                  <div><label className={lbl}>ราคา (บาท)</label><input name="price" type="number" min={0} defaultValue={a.priceSatang / 100} className={`${adminInput} w-28`} /></div>
                  <label className="flex items-center gap-2 pb-2 text-xs"><input type="checkbox" name="active" defaultChecked={a.active} className="accent-[var(--accent)]" /> เปิดขาย</label>
                  <button className={smallBtnOutline}>บันทึก</button>
                </form>
                <form action={deleteAddOn}>
                  <input type="hidden" name="id" value={a.id} />
                  <ConfirmButton message={`ลบ "${a.name}"?`} className="pb-2 text-xs text-muted underline hover:text-accent">ลบ</ConfirmButton>
                </form>
                <span className="pb-2 text-xs text-muted">{formatBaht(a.priceSatang)}</span>
              </div>
            ))}
            <form action={saveAddOn} className="flex flex-wrap items-end gap-3 border-t border-[var(--line)] pt-4">
              <div><label className={lbl}>เพิ่มของเสริม</label><input name="name" placeholder="ชื่อ" required className={`${adminInput} w-56`} /></div>
              <div><label className={lbl}>ราคา (บาท)</label><input name="price" type="number" min={0} defaultValue={300} className={`${adminInput} w-28`} /></div>
              <button className={smallBtn}>เพิ่ม</button>
            </form>
          </div>
        </Card>
      </div>
      {sp.ok && <span className="sr-only">บันทึกแล้ว</span>}
    </>
  );
}
