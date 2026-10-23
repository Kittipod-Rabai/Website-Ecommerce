import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-accent">404</p>
      <h1 className="display mt-3 text-4xl sm:text-5xl">ไม่พบหน้าที่คุณหา</h1>
      <p className="mt-4 text-muted">หน้านี้อาจถูกย้ายหรือลบไปแล้ว</p>
      <Link href="/" className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white hover:bg-accent-hover">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
