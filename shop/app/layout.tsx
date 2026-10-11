import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans_Thai, Manrope, Noto_Serif_Thai } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/store/CartProvider";
import { CartDrawer } from "@/components/store/CartDrawer";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--f-display",
});
const displayTh = Noto_Serif_Thai({
  subsets: ["thai"],
  weight: ["400", "500", "600"],
  variable: "--f-display-th",
});
const body = Manrope({ subsets: ["latin"], variable: "--f-body" });
const bodyTh = IBM_Plex_Sans_Thai({
  subsets: ["thai"],
  weight: ["300", "400", "500", "600"],
  variable: "--f-body-th",
});

export const metadata: Metadata = {
  title: { default: "Maison Fleur — ดอกไม้สด ส่งถึงมือ", template: "%s · Maison Fleur" },
  description: "ช่อดอกไม้สดจัดโดยฟลอริสต์มืออาชีพ เลือกวัน-เวลาจัดส่งได้ ส่งทั่วกรุงเทพฯ และปริมณฑล",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={`${display.variable} ${displayTh.variable} ${body.variable} ${bodyTh.variable}`}>
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
