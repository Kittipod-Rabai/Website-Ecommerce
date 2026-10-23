"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-snow hover:bg-accent"
    >
      พิมพ์
    </button>
  );
}
