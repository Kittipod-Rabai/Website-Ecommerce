import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const base = process.env.AUTH_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, occasions] = await Promise.all([
    db.product.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
    db.occasion.findMany({ select: { slug: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/flowers`, changeFrequency: "daily", priority: 0.9 },
    ...occasions.map((o) => ({ url: `${base}/occasions/${o.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: `${base}/flowers/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: `${base}/policy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
