import type { Metadata } from "next";
import { CatalogView } from "@/components/store/CatalogView";

export const metadata: Metadata = { title: "ดอกไม้ทั้งหมด" };
export const dynamic = "force-dynamic";

export default async function FlowersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return (
    <>
      <section className="on-dark bg-ink pb-16 pt-36 text-snow">
        <div className="container-x">
          <p className="eyebrow mb-4 text-[#e8a0b0]">Collection</p>
          <h1 className="display text-6xl lg:text-8xl">ดอกไม้ทั้งหมด</h1>
        </div>
      </section>
      <CatalogView basePath="/flowers" params={params} />
    </>
  );
}
