"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="display text-4xl sm:text-5xl">เกิดข้อผิดพลาดบางอย่าง</h1>
      <p className="mt-4 text-muted">ขออภัย ระบบขัดข้องชั่วคราว กรุณาลองใหม่อีกครั้ง</p>
      <button onClick={reset} className="mt-8 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white hover:bg-accent-hover">
        ลองใหม่
      </button>
    </div>
  );
}
