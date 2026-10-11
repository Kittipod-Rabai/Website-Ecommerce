import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CatalogView } from "@/components/store/CatalogView";
import { PageBanner } from "@/components/store/PageBanner";

export const dynamic = "force-dynamic";

const PHOTO: Record<string, string> = {
  birthday: "sunflower-mix",
  valentine: "red-vase",
  congrats: "sunflower-wrap",
  "thank-you": "peach-bouquet",
  "get-well": "sunflower-vase",
  sympathy: "white-wrap",
};

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
      <PageBanner eyebrow="ดอกไม้ตามโอกาส" title={occasion.name} sub={occasion.tagline} photo={PHOTO[slug] ?? "rose-bouquet"} />
      <CatalogView basePath={`/occasions/${slug}`} params={sp} fixed={{ occasion: slug }} />
    </>
  );
}
