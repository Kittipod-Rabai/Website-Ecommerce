import { describe, expect, it } from "vitest";
import {
  addDays,
  bangkokParts,
  deliveryFee,
  findZone,
  listDateOptions,
  listSlotOptions,
  validateSelection,
  type Slot,
  type Zone,
} from "./delivery";

const zones: Zone[] = [
  { id: "bkk", name: "BKK", postcodes: ["10"], feeSatang: 10000, sameDayCutoff: "14:00" },
  { id: "peri", name: "Peri", postcodes: ["11", "12", "10270"], feeSatang: 18000, sameDayCutoff: "12:00" },
];
const slots: Slot[] = [
  { id: "a", label: "09-12", startTime: "09:00", endTime: "12:00" },
  { id: "b", label: "12-15", startTime: "12:00", endTime: "15:00" },
  { id: "c", label: "15-18", startTime: "15:00", endTime: "18:00" },
];
// Bangkok time = UTC + 7
const bkk = (iso: string) => new Date(new Date(iso + "Z").getTime() - 7 * 3600_000);

describe("bangkokParts", () => {
  it("rolls the date over using Bangkok time", () => {
    // 20:00 UTC on 1 Jan is 03:00 on 2 Jan in Bangkok
    expect(bangkokParts(new Date("2026-01-01T20:00:00Z"))).toEqual({ date: "2026-01-02", minutes: 180 });
  });
});

describe("findZone", () => {
  it("matches the longest postcode prefix", () => {
    expect(findZone("10110", zones)?.id).toBe("bkk");
    expect(findZone("10270", zones)?.id).toBe("peri");
    expect(findZone("12000", zones)?.id).toBe("peri");
  });
  it("returns null outside delivery areas", () => {
    expect(findZone("50000", zones)).toBeNull();
  });
});

describe("deliveryFee", () => {
  it("is free above the threshold", () => {
    expect(deliveryFee(zones[0], 300000, 300000)).toBe(0);
    expect(deliveryFee(zones[0], 299999, 300000)).toBe(10000);
  });
});

describe("listDateOptions", () => {
  const base = { zone: zones[0], leadHours: 4, slots, capacities: [], defaultCapacity: 30 };

  it("allows same-day before cutoff with enough lead time", () => {
    const opts = listDateOptions({ ...base, now: bkk("2026-03-10T08:00:00") });
    expect(opts[0]).toMatchObject({ date: "2026-03-10", available: true });
  });
  it("blocks same-day after cutoff", () => {
    const opts = listDateOptions({ ...base, now: bkk("2026-03-10T14:30:00") });
    expect(opts[0]).toMatchObject({ available: false, reason: "cutoff" });
    expect(opts[1].available).toBe(true);
  });
  it("blocks same-day when no slot is reachable given lead time", () => {
    // 13:30 + 4h = 17:30, last slot starts 15:00 -> none
    const opts = listDateOptions({ ...base, now: bkk("2026-03-10T13:30:00") });
    expect(opts[0]).toMatchObject({ available: false, reason: "cutoff" });
  });
  it("uses the zone-specific cutoff", () => {
    const opts = listDateOptions({ ...base, zone: zones[1], leadHours: 2, now: bkk("2026-03-10T12:30:00") });
    expect(opts[0].reason).toBe("cutoff");
  });
  it("marks full and closed days", () => {
    const opts = listDateOptions({
      ...base,
      now: bkk("2026-03-10T08:00:00"),
      capacities: [
        { date: "2026-03-11", maxOrders: 5, usedOrders: 5, closed: false },
        { date: "2026-03-12", maxOrders: 5, usedOrders: 0, closed: true },
      ],
    });
    expect(opts[1]).toMatchObject({ available: false, reason: "full" });
    expect(opts[2]).toMatchObject({ available: false, reason: "closed" });
    expect(opts[3].available).toBe(true);
  });
});

describe("listSlotOptions", () => {
  it("applies lead time only for today", () => {
    const now = bkk("2026-03-10T09:00:00");
    const today = listSlotOptions({ now, date: "2026-03-10", leadHours: 4, slots });
    expect(today.map((s) => s.available)).toEqual([false, false, true]); // earliest start = 13:00
  });
  it("allows every slot for future dates", () => {
    const now = bkk("2026-03-10T09:00:00");
    expect(listSlotOptions({ now, date: addDays("2026-03-10", 1), leadHours: 6, slots }).every((s) => s.available)).toBe(true);
  });
});

describe("validateSelection", () => {
  const base = { zone: zones[0], leadHours: 4, slots, capacities: [], defaultCapacity: 30 };
  it("accepts a valid future selection", () => {
    expect(validateSelection({ ...base, now: bkk("2026-03-10T08:00:00"), date: "2026-03-11", slotId: "a" })).toEqual({ ok: true });
  });
  it("rejects past dates and unknown slots", () => {
    expect(validateSelection({ ...base, now: bkk("2026-03-10T08:00:00"), date: "2026-03-09", slotId: "a" }).ok).toBe(false);
    expect(validateSelection({ ...base, now: bkk("2026-03-10T08:00:00"), date: "2026-03-11", slotId: "zzz" }).ok).toBe(false);
  });
});
