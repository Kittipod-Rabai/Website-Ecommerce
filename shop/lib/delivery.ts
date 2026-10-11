/**
 * Delivery rules — the single source of truth for dates, slots, zones and fees.
 * Pure functions (no DB access) so they are easy to unit test.
 * All wall-clock logic is in Asia/Bangkok (UTC+7, no DST).
 */

export const BKK_OFFSET_MS = 7 * 3600_000;

export type Zone = { id: string; name: string; postcodes: string[]; feeSatang: number; sameDayCutoff: string };
export type Slot = { id: string; label: string; startTime: string; endTime: string };
export type Capacity = { date: string; maxOrders: number; usedOrders: number; closed: boolean };

export type DateOption = {
  date: string; // YYYY-MM-DD
  available: boolean;
  reason?: "closed" | "full" | "cutoff" | "past";
  remaining?: number;
};

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** Wall-clock parts of `now` in Bangkok. */
export function bangkokParts(now: Date) {
  const shifted = new Date(now.getTime() + BKK_OFFSET_MS);
  const iso = shifted.toISOString();
  return { date: iso.slice(0, 10), minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes() };
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Longest matching postcode prefix wins; "*" is a fallback zone. */
export function findZone(postcode: string, zones: Zone[]): Zone | null {
  const clean = postcode.trim();
  let best: Zone | null = null;
  let bestLen = -1;
  for (const z of zones) {
    for (const p of z.postcodes) {
      if (p === "*" && bestLen < 0) {
        best = z;
        bestLen = 0;
      } else if (p !== "*" && clean.startsWith(p) && p.length > bestLen) {
        best = z;
        bestLen = p.length;
      }
    }
  }
  return best;
}

export function deliveryFee(zone: Zone, subtotalSatang: number, freeOverSatang?: number): number {
  if (freeOverSatang && freeOverSatang > 0 && subtotalSatang >= freeOverSatang) return 0;
  return zone.feeSatang;
}

/**
 * Can an order for `date` still be placed right now?
 * Today is allowed only before the zone's same-day cutoff, and only if at
 * least one slot remains after the bouquet's preparation lead time.
 */
export function listDateOptions(opts: {
  now: Date;
  zone: Zone;
  leadHours: number;
  slots: Slot[];
  capacities: Capacity[];
  defaultCapacity: number;
  daysAhead?: number;
}): DateOption[] {
  const { now, zone, leadHours, slots, capacities, defaultCapacity, daysAhead = 30 } = opts;
  const today = bangkokParts(now);
  const capByDate = new Map(capacities.map((c) => [c.date, c]));
  const out: DateOption[] = [];

  for (let i = 0; i < daysAhead; i++) {
    const date = addDays(today.date, i);
    const cap = capByDate.get(date);
    const max = cap?.maxOrders ?? defaultCapacity;
    const used = cap?.usedOrders ?? 0;

    if (cap?.closed) {
      out.push({ date, available: false, reason: "closed" });
      continue;
    }
    if (used >= max) {
      out.push({ date, available: false, reason: "full" });
      continue;
    }
    if (i === 0) {
      const beforeCutoff = today.minutes < toMinutes(zone.sameDayCutoff);
      const hasSlot = listSlotOptions({ now, date, leadHours, slots }).some((s) => s.available);
      if (!beforeCutoff || !hasSlot) {
        out.push({ date, available: false, reason: "cutoff" });
        continue;
      }
    }
    out.push({ date, available: true, remaining: max - used });
  }
  return out;
}

export type SlotOption = Slot & { available: boolean };

/** For today a slot must start at least `leadHours` from now; future dates allow all slots. */
export function listSlotOptions(opts: { now: Date; date: string; leadHours: number; slots: Slot[] }): SlotOption[] {
  const { now, date, leadHours, slots } = opts;
  const today = bangkokParts(now);
  return slots.map((s) => {
    if (date < today.date) return { ...s, available: false };
    if (date > today.date) return { ...s, available: true };
    return { ...s, available: toMinutes(s.startTime) >= today.minutes + leadHours * 60 };
  });
}

/** Full server-side validation of a chosen date + slot. */
export function validateSelection(opts: {
  now: Date;
  zone: Zone;
  date: string;
  slotId: string;
  leadHours: number;
  slots: Slot[];
  capacities: Capacity[];
  defaultCapacity: number;
}): { ok: true } | { ok: false; error: string } {
  const dates = listDateOptions({ ...opts, daysAhead: 60 });
  const d = dates.find((x) => x.date === opts.date);
  if (!d) return { ok: false, error: "วันที่จัดส่งไม่ถูกต้อง" };
  if (!d.available) {
    const msg = { closed: "ร้านปิดทำการวันนี้", full: "วันดังกล่าวคิวเต็มแล้ว", cutoff: "เลยเวลารับออเดอร์สำหรับวันนี้แล้ว", past: "วันที่ผ่านมาแล้ว" }[d.reason ?? "past"];
    return { ok: false, error: msg };
  }
  const slot = listSlotOptions(opts).find((s) => s.id === opts.slotId);
  if (!slot) return { ok: false, error: "ช่วงเวลาจัดส่งไม่ถูกต้อง" };
  if (!slot.available) return { ok: false, error: "ช่วงเวลานี้ไม่สามารถจัดส่งทันแล้ว กรุณาเลือกช่วงอื่น" };
  return { ok: true };
}
