import { cn } from "@/lib/utils";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/status";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-[0.7rem] font-semibold", STATUS_STYLE[status])}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PageHeader({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display text-4xl lg:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, children, className, action }: { title?: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-[var(--line)] bg-snow p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-4">
          {title && <h2 className="display text-2xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export const adminInput =
  "w-full rounded-xl border border-[var(--line)] bg-snow px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-accent";

export const smallBtn =
  "inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50";

export const smallBtnOutline =
  "inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-snow px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent";
