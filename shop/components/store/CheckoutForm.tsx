"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useCart, lineTotal } from "./CartProvider";
import { FlowerArt } from "./FlowerArt";
import { formatBaht } from "@/lib/money";
import { cn } from "@/lib/utils";
import { listSlotOptions } from "@/lib/delivery";
import { getDeliveryOptions, submitOrder, type DeliveryOptions } from "@/app/(store)/checkout/actions";

type Saved = { id: string; recipientName: string; phone: string; line1: string; district: string; province: string; postcode: string };

const TH_DAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const REASON: Record<string, string> = { closed: "ปิดทำการ", full: "คิวเต็ม", cutoff: "เลยเวลารับออเดอร์", past: "" };

function Field({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="eyebrow mb-2 block text-muted">{label}</span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-accent">{error}</span>}
    </label>
  );
}

const inputCls =
  "w-full border border-[var(--line)] bg-snow/60 px-4 py-3 text-sm outline-none transition-colors focus:border-ink";

export function CheckoutForm({
  defaultEmail,
  saved,
}: {
  defaultEmail: string;
  saved: Saved[];
}) {
  const { lines, subtotal, ready } = useCart();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    buyerEmail: defaultEmail,
    buyerPhone: "",
    recipientName: "",
    recipientPhone: "",
    line1: "",
    district: "",
    province: "กรุงเทพมหานคร",
    postcode: "",
    giftMessage: "",
    senderName: "",
    anonymous: false,
  });
  const [date, setDate] = useState("");
  const [slotId, setSlotId] = useState("");
  const [opts, setOpts] = useState<DeliveryOptions | null>(null);
  const [loadingOpts, setLoadingOpts] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const cartPayload = useMemo(
    () => lines.map((l) => ({ variantId: l.variantId, qty: l.qty, addOnIds: l.addOns.map((a) => a.id) })),
    [lines],
  );
  const cartKey = JSON.stringify(cartPayload);

  useEffect(() => {
    if (!ready || lines.length === 0 || !/^\d{5}$/.test(form.postcode)) {
      setOpts(null);
      return;
    }
    let cancelled = false;
    setLoadingOpts(true);
    getDeliveryOptions(cartPayload, form.postcode).then((r) => {
      if (cancelled) return;
      setOpts(r);
      setLoadingOpts(false);
      if (r.ok) {
        setDate((d) => (r.dates.find((x) => x.date === d && x.available) ? d : ""));
        setSlotId("");
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.postcode, cartKey, ready]);

  const okOpts = opts && opts.ok ? opts : null;
  const slotOptions = useMemo(
    () =>
      okOpts && date
        ? listSlotOptions({ now: new Date(okOpts.nowIso), date, leadHours: okOpts.leadHours, slots: okOpts.slots })
        : [],
    [okOpts, date],
  );

  const fee = okOpts?.fee ?? 0;
  const total = subtotal + fee;

  function applySaved(s: Saved) {
    setForm((f) => ({
      ...f,
      recipientName: s.recipientName,
      recipientPhone: s.phone,
      line1: s.line1,
      district: s.district,
      province: s.province,
      postcode: s.postcode,
    }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    startTransition(async () => {
      const res = await submitOrder({ ...form, deliveryDate: date, deliverySlotId: slotId, cart: cartPayload });
      if (res.ok) {
        window.location.href = res.redirectUrl;
      } else {
        setFormError(res.error);
        setErrors(res.fieldErrors ?? {});
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  if (ready && lines.length === 0) {
    return (
      <div className="py-32 text-center">
        <p className="display text-5xl">ตะกร้ายังว่างอยู่</p>
        <div className="mt-8">
          <Link href="/flowers" className="text-sm underline underline-offset-4">
            เลือกช่อดอกไม้
          </Link>
        </div>
      </div>
    );
  }

  const canSubmit = !!date && !!slotId && !!okOpts && !pending;

  return (
    <form onSubmit={onSubmit} className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-20" noValidate>
      <div className="space-y-14">
        {formError && (
          <div role="alert" className="border border-accent bg-accent/5 px-5 py-4 text-sm text-accent">
            {formError}
          </div>
        )}

        <section>
          <h2 className="display mb-6 text-3xl">1. ผู้สั่งซื้อ</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="อีเมล" error={errors.buyerEmail}>
              <input type="email" autoComplete="email" className={inputCls} value={form.buyerEmail} onChange={(e) => set("buyerEmail", e.target.value)} required />
            </Field>
            <Field label="เบอร์โทรผู้สั่ง" error={errors.buyerPhone}>
              <input inputMode="tel" autoComplete="tel" className={inputCls} placeholder="0812345678" value={form.buyerPhone} onChange={(e) => set("buyerPhone", e.target.value)} required />
            </Field>
          </div>
        </section>

        <section>
          <h2 className="display mb-6 text-3xl">2. ผู้รับและที่อยู่จัดส่ง</h2>
          {saved.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              {saved.map((s) => (
                <button type="button" key={s.id} onClick={() => applySaved(s)} className="border border-[var(--line)] px-3 py-2 text-xs hover:border-ink">
                  ใช้ที่อยู่: {s.recipientName}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="ชื่อผู้รับ" error={errors.recipientName}>
              <input className={inputCls} autoComplete="off" value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} required />
            </Field>
            <Field label="เบอร์โทรผู้รับ" error={errors.recipientPhone}>
              <input inputMode="tel" className={inputCls} placeholder="0812345678" value={form.recipientPhone} onChange={(e) => set("recipientPhone", e.target.value)} required />
            </Field>
            <Field label="ที่อยู่ (บ้านเลขที่ ซอย ถนน)" error={errors.line1} className="sm:col-span-2">
              <input className={inputCls} value={form.line1} onChange={(e) => set("line1", e.target.value)} required />
            </Field>
            <Field label="เขต / อำเภอ" error={errors.district}>
              <input className={inputCls} value={form.district} onChange={(e) => set("district", e.target.value)} required />
            </Field>
            <Field label="จังหวัด" error={errors.province}>
              <input className={inputCls} value={form.province} onChange={(e) => set("province", e.target.value)} required />
            </Field>
            <Field label="รหัสไปรษณีย์" error={errors.postcode}>
              <input inputMode="numeric" maxLength={5} className={inputCls} placeholder="10110" value={form.postcode} onChange={(e) => set("postcode", e.target.value.replace(/\D/g, ""))} required />
            </Field>
          </div>
          {opts && !opts.ok && <p role="alert" className="mt-4 text-sm text-accent">{opts.error}</p>}
          {okOpts && <p className="mt-4 text-sm text-muted">โซนจัดส่ง: {okOpts.zoneName}</p>}
        </section>

        <section>
          <h2 className="display mb-6 text-3xl">3. วัน-เวลาจัดส่ง</h2>
          {!okOpts ? (
            <p className="border border-dashed border-[var(--line)] px-5 py-8 text-center text-sm text-muted">
              {loadingOpts ? "กำลังตรวจสอบคิวจัดส่ง…" : "กรอกรหัสไปรษณีย์เพื่อดูวันและเวลาที่จัดส่งได้"}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-7" role="radiogroup" aria-label="วันจัดส่ง">
                {okOpts.dates.slice(0, 21).map((d) => {
                  const dt = new Date(`${d.date}T00:00:00Z`);
                  const sel = date === d.date;
                  return (
                    <button
                      type="button"
                      key={d.date}
                      role="radio"
                      aria-checked={sel}
                      disabled={!d.available}
                      onClick={() => {
                        setDate(d.date);
                        setSlotId("");
                      }}
                      title={d.available ? "" : REASON[d.reason ?? "past"]}
                      className={cn(
                        "flex flex-col items-center border px-1 py-3 text-center transition-colors",
                        sel ? "border-ink bg-ink text-snow" : "border-[var(--line)] hover:border-ink",
                        !d.available && "cursor-not-allowed opacity-35 hover:border-[var(--line)]",
                      )}
                    >
                      <span className="text-[0.65rem] uppercase opacity-60">{TH_DAYS[dt.getUTCDay()]}</span>
                      <span className="display text-2xl">{dt.getUTCDate()}</span>
                      <span className="text-[0.65rem]">{TH_MONTHS[dt.getUTCMonth()]}</span>
                      {!d.available && <span className="mt-1 text-[0.6rem]">{REASON[d.reason ?? "past"]}</span>}
                    </button>
                  );
                })}
              </div>

              {date && (
                <div className="mt-6">
                  <p className="eyebrow mb-3 text-muted">ช่วงเวลา</p>
                  <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="ช่วงเวลาจัดส่ง">
                    {slotOptions.map((s) => (
                      <button
                        type="button"
                        key={s.id}
                        role="radio"
                        aria-checked={slotId === s.id}
                        disabled={!s.available}
                        onClick={() => setSlotId(s.id)}
                        className={cn(
                          "border px-4 py-4 text-sm transition-colors",
                          slotId === s.id ? "border-ink bg-ink text-snow" : "border-[var(--line)] hover:border-ink",
                          !s.available && "cursor-not-allowed opacity-35 hover:border-[var(--line)]",
                        )}
                      >
                        {s.label}
                        {!s.available && <span className="block text-[0.65rem]">เตรียมช่อไม่ทัน</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {errors.deliveryDate && <p className="mt-2 text-xs text-accent">{errors.deliveryDate}</p>}
            </>
          )}
        </section>

        <section>
          <h2 className="display mb-6 text-3xl">4. การ์ดข้อความ</h2>
          <div className="space-y-5">
            <Field label="ข้อความถึงผู้รับ (ไม่บังคับ)" error={errors.giftMessage}>
              <textarea rows={4} maxLength={300} className={inputCls} placeholder="เช่น สุขสันต์วันเกิดนะ ขอให้มีความสุขมากๆ" value={form.giftMessage} onChange={(e) => set("giftMessage", e.target.value)} />
              <span className="mt-1 block text-right text-xs text-muted">{form.giftMessage.length}/300</span>
            </Field>
            <div className="grid items-end gap-5 sm:grid-cols-2">
              <Field label="ชื่อผู้ส่งบนการ์ด">
                <input className={inputCls} disabled={form.anonymous} value={form.senderName} onChange={(e) => set("senderName", e.target.value)} />
              </Field>
              <label className="flex items-center gap-3 pb-3 text-sm">
                <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={form.anonymous} onChange={(e) => set("anonymous", e.target.checked)} />
                ส่งแบบไม่ออกนาม
              </label>
            </div>
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border border-[var(--line)] bg-snow/50 p-7">
          <h2 className="display mb-6 text-3xl">สรุปออเดอร์</h2>
          <ul className="divide-y divide-[var(--line)]">
            {lines.map((l) => (
              <li key={l.key} className="flex gap-4 py-4">
                <div className="h-20 w-16 shrink-0 overflow-hidden">
                  <FlowerArt seed={l.slug} palette={l.palette} />
                </div>
                <div className="flex-1 text-sm">
                  <p className="display text-lg leading-tight">{l.name}</p>
                  <p className="text-xs text-muted">ขนาด {l.label} × {l.qty}</p>
                  {l.addOns.map((a) => (
                    <p key={a.id} className="text-xs text-muted">+ {a.name}</p>
                  ))}
                </div>
                <span className="text-sm tabular-nums">{formatBaht(lineTotal(l))}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-[var(--line)] pt-5 text-sm">
            <div className="flex justify-between"><dt>ยอดสินค้า</dt><dd className="tabular-nums">{formatBaht(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>ค่าจัดส่ง</dt>
              <dd className="tabular-nums">{okOpts ? (fee === 0 ? "ฟรี" : formatBaht(fee)) : "—"}</dd>
            </div>
            {okOpts && okOpts.freeOver > 0 && fee > 0 && (
              <p className="text-xs text-muted">ซื้อครบ {formatBaht(okOpts.freeOver)} ส่งฟรี</p>
            )}
            <div className="flex items-baseline justify-between border-t border-[var(--line)] pt-4">
              <dt className="eyebrow">ยอดสุทธิ</dt>
              <dd className="display text-3xl tabular-nums">{formatBaht(total)}</dd>
            </div>
          </dl>
          <Button type="submit" disabled={!canSubmit} className="mt-6 w-full py-5">
            {pending ? "กำลังดำเนินการ…" : "ชำระเงิน"}
          </Button>
          {!canSubmit && !pending && <p className="mt-3 text-center text-xs text-muted">เลือกวันและช่วงเวลาจัดส่งก่อนชำระเงิน</p>}
          <p className="mt-4 text-center text-xs text-muted">ชำระผ่านบัตรเครดิต/เดบิต หรือ PromptPay</p>
        </div>
      </aside>
    </form>
  );
}
