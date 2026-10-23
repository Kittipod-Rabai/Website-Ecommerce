"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Flower2, LayoutDashboard, Package, ShieldCheck, SlidersHorizontal, Store, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "ออเดอร์", icon: Package },
  { href: "/admin/calendar", label: "ปฏิทินจัดส่ง", icon: CalendarDays },
  { href: "/admin/products", label: "สินค้า", icon: Flower2 },
  { href: "/admin/customers", label: "ลูกค้า", icon: Users },
  { href: "/admin/capacity", label: "คิวและโซนจัดส่ง", icon: SlidersHorizontal },
  { href: "/admin/settings", label: "บัญชีแอดมิน", icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="เมนูแอดมิน" className="mt-8 flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors",
              active ? "bg-snow/10 text-snow" : "text-snow/60 hover:bg-snow/5 hover:text-snow",
            )}
          >
            <Icon size={17} strokeWidth={1.5} />
            {label}
          </Link>
        );
      })}
      <Link href="/" className="flex shrink-0 items-center gap-3 px-3 py-2.5 text-sm text-snow/45 hover:text-snow lg:mt-6">
        <Store size={17} strokeWidth={1.5} />
        ดูหน้าร้าน
      </Link>
    </nav>
  );
}
