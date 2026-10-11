import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata: Metadata = { title: "ชำระเงิน" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await auth();
  const saved = session?.user?.id
    ? await db.savedAddress.findMany({ where: { userId: session.user.id } })
    : [];
  return (
    <div className="container-x pb-28 pt-32">
      <h1 className="display mb-12 text-5xl lg:text-7xl">ชำระเงิน</h1>
      <CheckoutForm defaultEmail={session?.user?.email ?? ""} saved={saved} />
    </div>
  );
}
