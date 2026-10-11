/** All money is stored as integer satang. */
export const toSatang = (baht: number) => Math.round(baht * 100);

export function formatBaht(satang: number): string {
  const baht = satang / 100;
  return "฿" + baht.toLocaleString("th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
