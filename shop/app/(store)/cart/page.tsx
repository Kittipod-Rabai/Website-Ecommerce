import type { Metadata } from "next";
import { CartPageView } from "@/components/store/CartPageView";

export const metadata: Metadata = { title: "ตะกร้าสินค้า" };

export default function CartPage() {
  return (
    <div className="container-x pb-28 pt-32">
      <h1 className="display mb-12 text-5xl lg:text-7xl">ตะกร้าสินค้า</h1>
      <CartPageView />
    </div>
  );
}
