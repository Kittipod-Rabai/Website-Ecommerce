import Link from "next/link";
import { db } from "@/lib/db";
import { listProducts, type CatalogFilter } from "@/lib/catalog";
import { ProductCard } from "./ProductCard";
import { cn } from "@/lib/utils";

const COLORS: { slug: string; name: string; hex: string }[] = [
  { slug: "red", name: "แดง", hex: "#a3162f" },
  { slug: "pink", name: "ชมพู", hex: "#e8a0b0" },
  { slug: "white", name: "ขาว", hex: "#f1ece4" },
  { slug: "yellow", name: "เหลือง", hex: "#e6b422" },
  { slug: "purple", name: "ม่วง", hex: "#a583c4" },
  { slug: "peach", name: "พีช", hex: "#f2b69c" },
  { slug: "mixed", name: "คละสี", hex: "linear-gradient(135deg,#c4506b,#e6b422,#a583c4)" },
];

const PRICES = [
  { key: "", label: "ทุกราคา" },
  { key: "0-1000", label: "ไม่เกิน ฿1,000" },
  { key: "1000-2000", label: "฿1,000 – 2,000" },
  { key: "2000-99999", label: "฿2,000 ขึ้นไป" },
];

const SORTS = [
  { key: "popular", label: "ยอดนิยม" },
  { key: "price-asc", label: "ราคาต่ำ → สูง" },
  { key: "price-desc", label: "ราคาสูง → ต่ำ" },
  { key: "new", label: "ใหม่ล่าสุด" },
];

type Params = Record<string, string | undefined>;

export async function CatalogView({
  basePath,
  params,
  fixed = {},
}: {
  basePath: string;
  params: Params;
  fixed?: Partial<CatalogFilter>;
}) {
  const [cats, occs] = await Promise.all([db.category.findMany(), db.occasion.findMany({ orderBy: { name: "asc" } })]);
  const [min, max] = (params.price ?? "").split("-").map((n) => (n ? Number(n) : undefined));
  const filter: CatalogFilter = {
    q: params.q?.trim() || undefined,
    category: params.category,
    occasion: fixed.occasion ?? params.occasion,
    color: params.color,
    min,
    max,
    sort: (params.sort as CatalogFilter["sort"]) || "popular",
  };
  const products = await listProducts(filter);

  const href = (patch: Params) => {
    const next: Params = { ...params, ...patch };
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  const chip = (active: boolean) =>
    cn(
      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
      active ? "border-accent bg-accent text-white" : "border-[var(--line)] hover:border-accent hover:text-accent",
    );

  return (
    <div className="container-x pb-24">
      {/* Filters */}
      <div className="space-y-5 border-b border-[var(--line)] pb-6">
        <form action={basePath} className="flex gap-2">
          {Object.entries(params).map(([k, v]) => k !== "q" && v && <input key={k} type="hidden" name={k} value={v} />)}
          <input
            name="q"
            defaultValue={params.q}
            placeholder="ค้นหาชื่อช่อ หรือชนิดดอกไม้ เช่น กุหลาบ"
            className="w-full max-w-md rounded-full border border-[var(--line)] bg-transparent px-5 py-3 text-sm outline-none focus:border-accent"
            aria-label="ค้นหา"
          />
          <button className="rounded-full bg-accent px-7 text-sm font-medium text-white hover:bg-accent-hover">ค้นหา</button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 w-12 shrink-0 text-sm text-muted">หมวด</span>
          <Link href={href({ category: undefined })} className={chip(!params.category)}>ทั้งหมด</Link>
          {cats.map((c) => (
            <Link key={c.id} href={href({ category: c.slug })} className={chip(params.category === c.slug)}>
              {c.name}
            </Link>
          ))}
        </div>

        {!fixed.occasion && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 w-12 shrink-0 text-sm text-muted">โอกาส</span>
            <Link href={href({ occasion: undefined })} className={chip(!params.occasion)}>ทั้งหมด</Link>
            {occs.map((o) => (
              <Link key={o.id} href={href({ occasion: o.slug })} className={chip(params.occasion === o.slug)}>
                {o.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 w-12 shrink-0 text-sm text-muted">สี</span>
          {COLORS.map((c) => (
            <Link
              key={c.slug}
              href={href({ color: params.color === c.slug ? undefined : c.slug })}
              aria-label={c.name}
              title={c.name}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                params.color === c.slug ? "border-ink ring-2 ring-paper ring-offset-1 ring-offset-ink" : "border-transparent",
              )}
              style={{ background: c.hex }}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 w-12 shrink-0 text-sm text-muted">ราคา</span>
            {PRICES.map((p) => (
              <Link key={p.key} href={href({ price: p.key || undefined })} className={chip((params.price ?? "") === p.key)}>
                {p.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-sm text-muted">เรียง</span>
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={href({ sort: s.key })}
                className={cn("px-2 py-1", (params.sort ?? "popular") === s.key ? "font-bold underline underline-offset-4" : "text-muted hover:text-ink")}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted">{products.length} รายการ</p>

      {products.length === 0 ? (
        <div className="py-32 text-center">
          <p className="display text-4xl">ไม่พบช่อดอกไม้ที่ตรงกับเงื่อนไข</p>
          <Link href={basePath} className="mt-6 inline-block text-sm underline underline-offset-4">
            ล้างตัวกรองทั้งหมด
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
          {products.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
