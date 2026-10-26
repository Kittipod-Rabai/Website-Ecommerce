import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { CLOUDINARY_HOST, saveImage } from "@/lib/storage";

export const COLOR_TAGS = [
  { value: "red", label: "แดง" },
  { value: "pink", label: "ชมพู" },
  { value: "white", label: "ขาว" },
  { value: "yellow", label: "เหลือง" },
  { value: "purple", label: "ม่วง" },
  { value: "peach", label: "พีช" },
  { value: "mixed", label: "คละสี" },
];

export const SIZES = ["S", "M", "L"] as const;

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base: string, ignoreId?: string) {
  const root = slugify(base) || `p-${randomBytes(3).toString("hex")}`;
  let slug = root;
  for (let i = 2; ; i++) {
    const clash = await db.product.findUnique({ where: { slug } });
    if (!clash || clash.id === ignoreId) return slug;
    slug = `${root}-${i}`;
  }
}

const priceField = z.preprocess(
  (v) => (v === "" || v == null ? undefined : Number(v)),
  z.number().int().min(1, "ราคาต้องมากกว่า 0").max(1_000_000).optional(),
);

const schema = z.object({
  name: z.string().trim().min(2, "กรุณากรอกชื่อสินค้า").max(100),
  description: z.string().trim().min(5, "กรุณากรอกรายละเอียด").max(2000),
  categoryId: z.string().min(1, "กรุณาเลือกหมวด"),
  colorTag: z.string().refine((v) => COLOR_TAGS.some((c) => c.value === v), "สีไม่ถูกต้อง"),
  flowerTypes: z.string().max(300),
  photos: z.string().max(2000),
  price_S: priceField,
  price_M: priceField,
  price_L: priceField,
  lead_S: z.coerce.number().int().min(1).max(72).default(4),
  lead_M: z.coerce.number().int().min(1).max(72).default(4),
  lead_L: z.coerce.number().int().min(1).max(72).default(6),
});

export type SaveResult = { ok: true; id: string } | { ok: false; error: string };

export async function saveProduct(formData: FormData, id: string | null): Promise<SaveResult> {
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  const d = parsed.data;

  const prices = { S: d.price_S, M: d.price_M, L: d.price_L };
  const sizes = SIZES.filter((s) => prices[s] != null);
  if (sizes.length === 0) return { ok: false, error: "ต้องมีราคาอย่างน้อย 1 ขนาด" };

  const category = await db.category.findUnique({ where: { id: d.categoryId } });
  if (!category) return { ok: false, error: "ไม่พบหมวดสินค้า" };

  // photos: existing paths (one per line) + newly uploaded files
  const photos = d.photos
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("/photos/") || s.startsWith("/uploads/") || s.startsWith(CLOUDINARY_HOST));
  try {
    for (const f of formData.getAll("files")) {
      if (f instanceof File && f.size > 0) photos.push(await saveImage(f));
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "อัปโหลดรูปไม่สำเร็จ" };
  }
  if (photos.length === 0) return { ok: false, error: "ต้องมีรูปอย่างน้อย 1 รูป" };

  const occasionIds = formData.getAll("occasions").map(String);
  const data = {
    name: d.name,
    description: d.description,
    categoryId: d.categoryId,
    colorTag: d.colorTag,
    flowerTypes: JSON.stringify(
      d.flowerTypes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
    images: JSON.stringify(photos),
    bestseller: formData.get("bestseller") === "on",
    active: formData.get("active") === "on",
  };
  const lead = { S: d.lead_S, M: d.lead_M, L: d.lead_L };

  const productId = await db.$transaction(async (tx) => {
    const product = id
      ? await tx.product.update({ where: { id }, data })
      : await tx.product.create({ data: { ...data, slug: await uniqueSlug(d.name) } });

    await tx.productOccasion.deleteMany({ where: { productId: product.id } });
    if (occasionIds.length)
      await tx.productOccasion.createMany({ data: occasionIds.map((occasionId) => ({ productId: product.id, occasionId })) });

    const existing = await tx.variant.findMany({ where: { productId: product.id } });
    for (const label of SIZES) {
      const price = prices[label];
      const found = existing.find((v) => v.label === label);
      if (price == null) {
        if (found) await tx.variant.delete({ where: { id: found.id } });
      } else if (found) {
        await tx.variant.update({ where: { id: found.id }, data: { priceSatang: price * 100, leadTimeHours: lead[label] } });
      } else {
        await tx.variant.create({ data: { productId: product.id, label, priceSatang: price * 100, leadTimeHours: lead[label] } });
      }
    }
    return product.id;
  });
  return { ok: true, id: productId };
}
