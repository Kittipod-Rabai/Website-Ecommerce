import Link from "next/link";
import { Flower2 } from "lucide-react";

export function Footer() {
  const a = "transition-colors hover:text-[#f3b5c5]";
  return (
    <footer className="px-3 pb-3 sm:px-6 sm:pb-6">
      <div className="on-dark mx-auto max-w-[1320px] rounded-[2rem] bg-forest-deep text-snow">
        <div className="grid gap-12 px-6 py-16 sm:px-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="flex items-center gap-2 text-xl">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"><Flower2 size={20} /></span>
              <span className="display">Maison Fleur</span>
            </p>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-snow/65">
              ดอกไม้สดคัดสรรทุกเช้า จัดโดยฟลอริสต์มืออาชีพ ส่งถึงมือผู้รับตรงเวลาในกรุงเทพฯ และปริมณฑล
            </p>
          </div>
          <div>
            <p className="display mb-5 text-base">ช้อป</p>
            <ul className="space-y-3 text-sm text-snow/70">
              <li><Link href="/flowers" className={a}>ดอกไม้ทั้งหมด</Link></li>
              <li><Link href="/occasions/birthday" className={a}>วันเกิด</Link></li>
              <li><Link href="/occasions/valentine" className={a}>วาเลนไทน์</Link></li>
              <li><Link href="/track" className={a}>ติดตามออเดอร์</Link></li>
            </ul>
          </div>
          <div>
            <p className="display mb-5 text-base">ติดต่อ</p>
            <ul className="space-y-3 text-sm text-snow/70">
              <li><Link href="/account" className={a}>บัญชีของฉัน</Link></li>
              <li>โทร 02-000-0000</li>
              <li>ทุกวัน 08:00 – 19:00</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--line-dark)] px-6 py-6 sm:px-12">
          <div className="flex flex-col justify-between gap-2 text-xs text-snow/50 sm:flex-row">
            <span>© {new Date().getFullYear()} Maison Fleur · โปรเจกต์เพื่อการศึกษา</span>
            <span>ดอกไม้สดเป็นสินค้าเน่าเสียง่าย ไม่รับคืนสินค้า</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
