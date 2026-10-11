import Link from "next/link";
import { FlowerArt } from "./FlowerArt";
import { formatBaht } from "@/lib/money";
import type { ProductCardData } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export function ProductCard({ p, dark = false }: { p: ProductCardData; dark?: boolean }) {
  return (
    <Link href={`/flowers/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden">
        <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]">
          <FlowerArt seed={p.slug} palette={p.palette} tone={dark ? "dark" : "light"} />
        </div>
        {p.bestseller && (
          <span className="eyebrow absolute left-3 top-3 bg-snow px-2.5 py-1.5 text-[0.62rem] text-ink">ขายดี</span>
        )}
        <span className="eyebrow absolute inset-x-0 bottom-0 translate-y-full bg-ink/90 py-3.5 text-center text-[0.68rem] text-snow transition-transform duration-500 group-hover:translate-y-0">
          ดูรายละเอียด
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="display text-[1.4rem]">{p.name}</h3>
        <span className={cn("shrink-0 text-sm tabular-nums", dark ? "text-snow/70" : "text-muted")}>
          เริ่ม {formatBaht(p.fromPrice)}
        </span>
      </div>
      <p className={cn("mt-1 text-xs", dark ? "text-snow/45" : "text-muted")}>{p.category}</p>
    </Link>
  );
}
