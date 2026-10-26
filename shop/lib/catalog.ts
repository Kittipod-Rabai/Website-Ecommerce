import { contains } from "@/lib/db-flavor";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/utils";

const productInclude = {
  variants: { orderBy: { priceSatang: "asc" as const } },
  category: true,
  occasions: { include: { occasion: true } },
} satisfies Prisma.ProductInclude;

export type ProductWithRels = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  image: string;
  fromPrice: number;
  category: string;
  bestseller: boolean;
};

export function toCard(p: ProductWithRels): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: parseJson<string[]>(p.images, [])[0] ?? "/photos/rose-bouquet.jpg",
    fromPrice: Math.min(...p.variants.map((v) => v.priceSatang)),
    category: p.category.name,
    bestseller: p.bestseller,
  };
}

export type CatalogFilter = {
  q?: string;
  category?: string;
  occasion?: string;
  color?: string;
  min?: number;
  max?: number;
  sort?: "popular" | "price-asc" | "price-desc" | "new";
};

export async function listProducts(f: CatalogFilter = {}): Promise<ProductCardData[]> {
  const where: Prisma.ProductWhereInput = { active: true };
  if (f.category) where.category = { slug: f.category };
  if (f.occasion) where.occasions = { some: { occasion: { slug: f.occasion } } };
  if (f.color) where.colorTag = f.color;
  if (f.q) {
    where.OR = [{ name: contains(f.q) }, { flowerTypes: contains(f.q) }, { description: contains(f.q) }];
  }
  const rows = await db.product.findMany({ where, include: productInclude, orderBy: { createdAt: "desc" } });
  let cards = rows.map(toCard);
  if (f.min != null) cards = cards.filter((c) => c.fromPrice >= f.min! * 100);
  if (f.max != null) cards = cards.filter((c) => c.fromPrice <= f.max! * 100);
  switch (f.sort) {
    case "price-asc":
      cards.sort((a, b) => a.fromPrice - b.fromPrice);
      break;
    case "price-desc":
      cards.sort((a, b) => b.fromPrice - a.fromPrice);
      break;
    case "new":
      break;
    default:
      cards.sort((a, b) => Number(b.bestseller) - Number(a.bestseller));
  }
  return cards;
}

export function getProduct(slug: string) {
  return db.product.findFirst({ where: { slug, active: true }, include: productInclude });
}
