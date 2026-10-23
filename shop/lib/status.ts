export const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "รอชำระเงิน",
  PAID: "ชำระเงินแล้ว",
  PREPARING: "กำลังจัดช่อ",
  OUT_FOR_DELIVERY: "กำลังจัดส่ง",
  DELIVERED: "ส่งถึงแล้ว",
  CANCELLED: "ยกเลิก",
  REFUNDED: "คืนเงินแล้ว",
};

export const STATUS_STYLE: Record<string, string> = {
  PENDING_PAYMENT: "bg-[#f3e9c8] text-[#6b5516]",
  PAID: "bg-[#d8e8f5] text-[#1f4e79]",
  PREPARING: "bg-[#f1ddf0] text-[#6a2a6a]",
  OUT_FOR_DELIVERY: "bg-[#fde3c8] text-[#8a4a0b]",
  DELIVERED: "bg-[#d6ecd6] text-[#1f5a2a]",
  CANCELLED: "bg-[#e5e1de] text-[#5d5654]",
  REFUNDED: "bg-[#f6d5da] text-[#7a1f36]",
};

/** Statuses an admin may move an order to, from its current status. */
export const NEXT_STATUSES: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAID: ["PREPARING", "OUT_FOR_DELIVERY", "CANCELLED", "REFUNDED"],
  PREPARING: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

const TH_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
const TH_DAYS_FULL = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export function thaiDate(ymd: string, withWeekday = false) {
  const d = new Date(`${ymd}T00:00:00Z`);
  const base = `${d.getUTCDate()} ${TH_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`;
  return withWeekday ? `${TH_DAYS_FULL[d.getUTCDay()]} ${base}` : base;
}
