import { SiteHeader } from "@/components/store/SiteHeader";
import { Footer } from "@/components/store/Footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
