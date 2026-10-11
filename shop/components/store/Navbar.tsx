"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);

  const overHero = pathname === "/";
  const solid = !overHero || scrolled || mega || mobile;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMega(false);
    setMobile(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
  }, [mobile]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        solid ? "bg-ink text-snow shadow-[0_1px_0_var(--line-dark)]" : "bg-gradient-to-b from-ink/60 to-transparent text-snow",
      )}
      onMouseLeave={() => setMega(false)}
    >
      <div className="container-x on-dark flex h-[72px] items-center justify-between">
        <div className="flex flex-1 items-center gap-8">
          <button className="lg:hidden" aria-label="เมนู" onClick={() => setMobile((v) => !v)}>
            {mobile ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav className="hidden items-center gap-8 text-[0.78rem] font-semibold uppercase tracking-[0.16em] lg:flex" aria-label="เมนูหลัก">
            <button
              className={cn("py-6 transition-opacity", mega ? "opacity-100" : "opacity-90 hover:opacity-100")}
              onMouseEnter={() => setMega(true)}
              onFocus={() => setMega(true)}
              aria-expanded={mega}
            >
              โอกาสพิเศษ
            </button>
            {categories.map((c) => (
              <Link key={c.slug} href={`/flowers?category=${c.slug}`} className="py-6 opacity-90 hover:opacity-100" onMouseEnter={() => setMega(false)}>
                {c.name}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" className="display text-center text-[1.65rem] tracking-[0.04em]" aria-label="Maison Fleur หน้าแรก">
          Maison <span className="italic">Fleur</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-5">
          <Link href="/flowers" aria-label="ค้นหา" className="hover:opacity-70">
            <Search size={20} />
          </Link>
          <Link
            href={user ? (user.role === "ADMIN" ? "/admin" : "/account") : "/login"}
            aria-label={user ? "บัญชีของฉัน" : "เข้าสู่ระบบ"}
            className="hover:opacity-70"
          >
            <User size={20} />
          </Link>
          <button onClick={() => setOpen(true)} aria-label={`ตะกร้า ${count} ชิ้น`} className="relative hover:opacity-70">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-2.5 -top-2.5 flex h-[18px] min-w-[18px] items-center justify-center bg-accent px-1 text-[0.65rem] font-bold">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* mega menu */}
      <AnimatePresence>
        {mega && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-x-0 top-[72px] hidden border-t border-[var(--line-dark)] bg-ink lg:block"
          >
            <div className="container-x grid grid-cols-6 gap-6 py-10">
              {occasions.map((o) => (
                <Link key={o.slug} href={`/occasions/${o.slug}`} className="group block">
                  <p className="display text-2xl transition-colors group-hover:text-[#e8a0b0]">{o.name}</p>
                  <p className="mt-2 text-xs leading-relaxed text-snow/55">{o.tagline}</p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* mobile menu */}
      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-[72px] overflow-y-auto bg-ink px-6 py-8 lg:hidden"
          >
            <p className="eyebrow mb-4 text-snow/50">โอกาสพิเศษ</p>
            <ul className="mb-10 space-y-3">
              {occasions.map((o) => (
                <li key={o.slug}>
                  <Link href={`/occasions/${o.slug}`} className="display text-3xl">
                    {o.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow mb-4 text-snow/50">หมวดสินค้า</p>
            <ul className="space-y-3">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/flowers?category=${c.slug}`} className="text-lg">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
