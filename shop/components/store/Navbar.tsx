"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Flower2, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "./CartProvider";

export type NavOccasion = { name: string; slug: string; tagline: string };
export type NavCategory = { name: string; slug: string };

export function Navbar({
  occasions,
  categories,
  user,
}: {
  occasions: NavOccasion[];
  categories: NavCategory[];
  user: { name?: string | null; role: string } | null;
}) {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    setMega(false);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  const link = "rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-blush";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4" onMouseLeave={() => setMega(false)}>
      <div className="mx-auto max-w-[1180px]">
        <div className="flex h-16 items-center justify-between gap-4 rounded-full bg-white/95 pl-5 pr-2.5 shadow-[0_8px_30px_rgba(29,26,27,0.1)] backdrop-blur">
          <Link href="/" className="flex items-center gap-2" aria-label="Maison Fleur หน้าแรก">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
              <Flower2 size={18} />
            </span>
            <span className="display text-lg">Maison Fleur</span>
          </Link>

          <nav className="hidden items-center whitespace-nowrap xl:flex" aria-label="เมนูหลัก">
            <Link href="/" className={link}>หน้าแรก</Link>
            <button
              className={cn(link, "flex items-center gap-1", mega && "bg-blush")}
              onMouseEnter={() => setMega(true)}
              onFocus={() => setMega(true)}
              aria-expanded={mega}
            >
              โอกาสพิเศษ <ChevronDown size={14} />
            </button>
            {categories.map((c) => (
              <Link key={c.slug} href={`/flowers?category=${c.slug}`} className={link} onMouseEnter={() => setMega(false)}>
                {c.name}
              </Link>
            ))}
            <Link href="/track" className={link}>ติดตามออเดอร์</Link>
          </nav>

          <div className="flex items-center gap-1">
            <Link href="/flowers" aria-label="ค้นหา" className="rounded-full p-2.5 hover:bg-blush">
              <Search size={19} />
            </Link>
            <Link
              href={user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/login"}
              aria-label={user ? "บัญชีของฉัน" : "เข้าสู่ระบบ"}
              className="rounded-full p-2.5 hover:bg-blush"
            >
              <User size={19} />
            </Link>
            <button
              onClick={() => setOpen(true)}
              aria-label={`ตะกร้า ${count} ชิ้น`}
              className="relative flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              <ShoppingBag size={17} />
              <span className="hidden sm:inline">ตะกร้า</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[0.7rem] font-semibold text-accent">
                  {count}
                </span>
              )}
            </button>
            <button className="rounded-full p-2.5 hover:bg-blush xl:hidden" aria-label="เมนู" onClick={() => setMobile((v) => !v)}>
              {mobile ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mega && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="mt-2 hidden rounded-3xl bg-white p-4 shadow-[0_16px_50px_rgba(29,26,27,0.14)] xl:block"
            >
              <div className="grid grid-cols-3 gap-2">
                {occasions.map((o) => (
                  <Link key={o.slug} href={`/occasions/${o.slug}`} className="group rounded-2xl p-4 transition-colors hover:bg-blush">
                    <p className="display text-base group-hover:text-accent">{o.name}</p>
                    <p className="mt-1 text-xs text-muted">{o.tagline}</p>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {mobile && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-2 max-h-[75vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-[0_16px_50px_rgba(29,26,27,0.14)] xl:hidden"
            >
              <p className="eyebrow mb-3 text-muted">โอกาสพิเศษ</p>
              <ul className="mb-6 grid grid-cols-2 gap-2">
                {occasions.map((o) => (
                  <li key={o.slug}>
                    <Link href={`/occasions/${o.slug}`} className="block rounded-2xl bg-blush px-4 py-3 text-sm font-medium">
                      {o.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="eyebrow mb-3 text-muted">หมวดสินค้า</p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/flowers?category=${c.slug}`} className="block rounded-xl px-2 py-2.5 hover:bg-blush">
                      {c.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/track" className="block rounded-xl px-2 py-2.5 hover:bg-blush">ติดตามออเดอร์</Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
