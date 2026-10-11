import Link from "next/link";

export const authInput =
  "w-full rounded-2xl border border-[var(--line)] bg-snow/60 px-4 py-3 text-sm outline-none transition-colors focus:border-ink";

export function AuthShell({
  title,
  subtitle,
  error,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  error?: string;
  children: React.ReactNode;
  footer: { text: string; href: string; cta: string };
}) {
  return (
    <div className="container-x flex min-h-[85vh] items-center justify-center pb-20 pt-32">
      <div className="w-full max-w-md">
        <p className="eyebrow mb-3 text-accent">Maison Fleur</p>
        <h1 className="display text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-muted">{subtitle}</p>
        {error && (
          <p role="alert" className="mt-6 border border-accent bg-accent/5 px-4 py-3 text-sm text-accent">
            {error}
          </p>
        )}
        <div className="mt-8">{children}</div>
        <p className="mt-8 text-center text-sm text-muted">
          {footer.text}{" "}
          <Link href={footer.href} className="text-ink underline underline-offset-4">
            {footer.cta}
          </Link>
        </p>
      </div>
    </div>
  );
}
