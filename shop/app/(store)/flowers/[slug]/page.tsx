import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getProduct, listProducts } from "@/lib/catalog";
import { parseJson } from "@/lib/utils";
import { FlowerArt } from "@/components/store/FlowerArt";
import { ProductPurchase } from "@/components/store/ProductPurchase";
import { ProductCard } from "@/components/store/ProductCard";
import { formatBaht } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? { title: p.name, description: p.description } : { title: "ไม่พบสินค้า" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const [addOns, related] = await Promise.all([
    db.addOn.findMany({ where: { active: true } }),
    listProducts({ category: product.category.slug }),
  ]);
  const palette = parseJson<string[]>(product.palette, []);
  const flowers = parseJson<string[]>(product.flowerTypes, []);
  const more = related.filter((r) => r.slug !== product.slug).slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    category: product.category.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "THB",
      lowPrice: Math.min(...product.variants.map((v) => v.priceSatang)) / 100,
      highPrice: Math.max(...product.variants.map((v) => v.priceSatang)) / 100,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-x pb-28 pt-28 lg:pt-32">
        <nav className="mb-8 text-xs text-muted" aria-label="breadcrumb">
          <Link href="/" className="hover:text-ink">หน้าแรก</Link> / <Link href="/flowers" className="hover:text-ink">ดอกไม้</Link> /{" "}
          <Link href={`/flowers?category=${product.category.slug}`} className="hover:text-ink">{product.category.name}</Link>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="aspect-[4/5] overflow-hidden md:col-span-2 md:aspect-[5/4]">
              <FlowerArt seed={product.slug} palette={palette} />
            </div>
            <div className="aspect-[4/5] overflow-hidden">
              <FlowerArt seed={product.slug + "-b"} palette={palette} tone="dark" />
            </div>
            <div className="aspect-[4/5] overflow-hidden">
              <FlowerArt seed={product.slug + "-c"} palette={[...palette].reverse()} />
            </div>
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="eyebrow mb-4 text-accent">{product.category.name}</p>
            <h1 className="display text-5xl lg:text-7xl">{product.name}</h1>
            <p className="mt-3 text-sm text-muted">เริ่มต้น {formatBaht(Math.min(...product.variants.map((v) => v.priceSatang)))}</p>
            <p className="mt-7 leading-relaxed text-ink/80">{product.description}</p>

            <dl className="mt-7 grid grid-cols-[110px_1fr] gap-y-2 border-y border-[var(--line)] py-5 text-sm">
              <dt className="text-muted">ดอกไม้</dt>
              <dd>{flowers.join(" · ")}</dd>
              <dt className="text-muted">โอกาส</dt>
              <dd>
                {product.occasions.map((o, i) => (
                  <span key={o.occasionId}>
                    {i > 0 && " · "}
                    <Link href={`/occasions/${o.occasion.slug}`} className="underline underline-offset-4">
                      {o.occasion.name}
                    </Link>
                  </span>
                ))}
              </dd>
              <dt className="text-muted">เตรียมช่อ</dt>
              <dd>อย่างน้อย {Math.min(...product.variants.map((v) => v.leadTimeHours))} ชั่วโมงก่อนส่ง</dd>
            </dl>

            <div className="mt-9">
              <ProductPurchase
                product={{ slug: product.slug, name: product.name, palette }}
                variants={product.variants.map((v) => ({ id: v.id, label: v.label, priceSatang: v.priceSatang }))}
                addOns={addOns.map((a) => ({ id: a.id, name: a.name, priceSatang: a.priceSatang }))}
              />
            </div>
          </div>
        </div>

        {more.length > 0 && (
          <section className="mt-28">
            <h2 className="display mb-10 text-4xl lg:text-5xl">คุณอาจชอบ</h2>
            <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
              {more.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
