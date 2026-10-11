import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost" | "light";

const base =
  "inline-flex items-center justify-center gap-2 px-7 py-3.5 text-[0.8rem] font-semibold tracking-[0.14em] uppercase transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  solid: "bg-accent text-white hover:bg-accent-hover",
  outline: "border border-current hover:bg-ink hover:text-snow hover:border-ink",
  ghost: "hover:opacity-70",
  light: "bg-snow text-ink hover:bg-paper",
};

type Common = { variant?: Variant; className?: string; children: React.ReactNode };

export function Button({
  variant = "solid",
  className,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(base, variants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "solid",
  className,
  href,
  children,
}: Common & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
