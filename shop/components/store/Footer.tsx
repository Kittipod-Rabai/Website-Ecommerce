import Link from "next/link";

export function Footer() {
  return (
    <footer className="on-dark bg-ink text-snow">
      <div className="container-x grid gap-12 py-20 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="display text-4xl">
            Maison <span className="italic">Fleur</span>
          </p>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-snow/60">
            ดอกไม้สดคัดสรรทุกเช้า จัดโดยฟลอริสต์มืออาชีพ ส่งถึงมือผู้รับตรงเวลาในกรุงเทพฯ และปริมณฑล
          </p>
        </div>
        <div>
          <p className="eyebrow mb-5 text-snow/50">ช้อป</p>
          <ul className="space-y-3 text-sm">
            <li><Link href="/flowers" className="hover:text-[#e8a0b0]">ดอกไม้ทั้งหมด</Link></li>
            <li><Link href="/occasions/birthday" className="hover:text-[#e8a0b0]">วันเกิด</Link></li>
            <li><Link href="/occasions/valentine" className="hover:text-[#e8a0b0]">วาเลนไทน์</Link></li>
            <li><Link href="/track" className="hover:text-[#e8a0b0]">ติดตามออเดอร์</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-5 text-snow/50">ข้อมูล</p>
          <ul className="space-y-3 text-sm">
            <li><Link href="/policy" className="hover:text-[#e8a0b0]">นโยบายจัดส่งและคืนเงิน</Link></li>
            <li><Link href="/account" className="hover:text-[#e8a0b0]">บัญชีของฉัน</Link></li>
            <li><span className="text-snow/60">โทร 02-000-0000</span></li>
            <li><span className="text-snow/60">ทุกวัน 08:00 – 19:00</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[var(--line-dark)]">
        <div className="container-x flex flex-col justify-between gap-2 py-6 text-xs text-snow/45 sm:flex-row">
          <span>© {new Date().getFullYear()} Maison Fleur. สงวนลิขสิทธิ์</span>
          <span>ดอกไม้สดเป็นสินค้าเน่าเสียง่าย ไม่รับคืนสินค้า</span>
        </div>
      </div>
    </footer>
  );
}
