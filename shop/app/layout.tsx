import type { Metadata } from "next";
import { Noto_Sans_Thai, Prompt } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/CartProvider";
import { CartDrawer } from "@/components/store/CartDrawer";

const display = Prompt({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--f-display",
});
const body = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--f-body",
});

export const metadata: Metadata = {
  title: { default: "Maison Fleur — ดอกไม้สด ส่งถึงมือ", template: "%s · Maison Fleur" },
  description: "ช่อดอกไม้สดจัดโดยฟลอริสต์มืออาชีพ เลือกวัน-เวลาจัดส่งได้ ส่งทั่วกรุงเทพฯ และปริมณฑล",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable}`}>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
