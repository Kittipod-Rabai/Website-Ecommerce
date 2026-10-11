import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatBaht } from "@/lib/money";
import type { ProductCardData } from "@/lib/catalog";

export function ProductCard({ p }: { p: ProductCardData }) {
  return (
    <Link href={`/flowers/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-paper-deep">
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="(min-width:1024px) 25vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {p.bestseller && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-accent">ขายดี</span>
        )}
        <span className="absolute bottom-3 right-3 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white text-ink opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </span>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
        <h3 className="display text-lg">{p.name}</h3>
        <span className="shrink-0 text-sm font-medium text-accent tabular-nums">{formatBaht(p.fromPrice)}</span>
      </div>
      <p className="mt-0.5 px-1 text-xs text-muted">{p.category}</p>
    </Link>
  );
}
