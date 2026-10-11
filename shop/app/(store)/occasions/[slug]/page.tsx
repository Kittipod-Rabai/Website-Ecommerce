import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CatalogView } from "@/components/store/CatalogView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = await db.occasion.findUnique({ where: { slug } });
  return { title: o ? `ดอกไม้สำหรับ${o.name}` : "โอกาสพิเศษ" };
}

export default async function OccasionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const occasion = await db.occasion.findUnique({ where: { slug } });
  if (!occasion) notFound();
  return (
    <>
      <section className="on-dark bg-ink pb-16 pt-36 text-snow">
        <div className="container-x">
          <p className="eyebrow mb-4 text-[#e8a0b0]">Occasion</p>
          <h1 className="display text-6xl lg:text-8xl">{occasion.name}</h1>
          <p className="mt-6 max-w-lg text-snow/65">{occasion.tagline}</p>
        </div>
      </section>
      <CatalogView basePath={`/occasions/${slug}`} params={sp} fixed={{ occasion: slug }} />
    </>
  );
}
