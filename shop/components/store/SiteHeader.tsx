import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Navbar } from "./Navbar";

export async function SiteHeader() {
  const [session, occasions, categories] = await Promise.all([
    auth(),
    db.occasion.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true, tagline: true } }),
    db.category.findMany({ select: { name: true, slug: true } }),
  ]);
  return (
    <Navbar
      occasions={occasions}
      categories={categories}
      user={session?.user ? { name: session.user.name, role: session.user.role } : null}
    />
  );
}
