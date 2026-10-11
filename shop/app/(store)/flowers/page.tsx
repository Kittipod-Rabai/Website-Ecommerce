import type { Metadata } from "next";
import { CatalogView } from "@/components/store/CatalogView";
import { PageBanner } from "@/components/store/PageBanner";

export const metadata: Metadata = { title: "ดอกไม้ทั้งหมด" };
export const dynamic = "force-dynamic";

export default async function FlowersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  return (
    <>
      <PageBanner eyebrow="คอลเลกชัน" title="ดอกไม้ทั้งหมด" sub="ช่อดอกไม้ กระเช้า แจกัน และดอกไม้แห้ง จัดด้วยมือทุกชิ้น" photo="tulips-market" />
      <CatalogView basePath="/flowers" params={params} />
    </>
  );
}
