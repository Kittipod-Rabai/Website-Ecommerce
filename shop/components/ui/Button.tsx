import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost" | "light" | "forest";

const base =
  "group inline-flex items-center justify-center gap-3 rounded-full px-7 py-3.5 text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  solid: "bg-accent text-white hover:bg-accent-hover",
  forest: "bg-forest text-white hover:bg-forest-deep",
  outline: "border border-ink/25 hover:border-ink hover:bg-ink hover:text-snow",
  ghost: "hover:opacity-70",
  light: "bg-snow text-ink hover:bg-blush",
};

type Common = { variant?: Variant; className?: string; children: React.ReactNode; arrow?: boolean };

const Arrow = () => (
  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-ink transition-transform duration-300 group-hover:rotate-45">
    <ArrowUpRight size={14} />
  </span>
);

export function Button({
  variant = "solid",
  className,
  arrow,
  children,
  ...props
}: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
      {arrow && <Arrow />}
    </button>
  );
}

export function ButtonLink({
  variant = "solid",
  className,
  href,
  children,
  arrow = true,
}: Common & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], arrow ? "pr-3" : "", className)}>
      {children}
      {arrow && <Arrow />}
    </Link>
  );
}
