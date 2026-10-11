import { cn } from "@/lib/utils";

/**
 * Procedural bouquet illustration used until real product photography is
 * uploaded. Deterministic per `seed`, so SSR and client output match.
 */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Bloom({
  cx,
  cy,
  r,
  petals,
  color,
  center,
  rot,
}: {
  cx: number;
  cy: number;
  r: number;
  petals: number;
  color: string;
  center: string;
  rot: number;
}) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse
          key={i}
          cx={0}
          cy={-r * 0.55}
          rx={r * 0.42}
          ry={r * 0.62}
          fill={color}
          opacity={0.88}
          transform={`rotate(${(360 / petals) * i})`}
        />
      ))}
      {Array.from({ length: petals }).map((_, i) => (
        <ellipse
          key={`i${i}`}
          cx={0}
          cy={-r * 0.3}
          rx={r * 0.26}
          ry={r * 0.36}
          fill="#fff"
          opacity={0.18}
          transform={`rotate(${(360 / petals) * i + 360 / petals / 2})`}
        />
      ))}
      <circle r={r * 0.2} fill={center} />
    </g>
  );
}

export function FlowerArt({
  seed,
  palette,
  className,
  tone = "light",
}: {
  seed: string;
  palette: string[];
  className?: string;
  tone?: "light" | "dark";
}) {
  const rand = rng(seed);
  const colors = palette.length ? palette : ["#c4506b", "#e8a0b0", "#f4d6dc"];
  const count = 7 + Math.floor(rand() * 4);
  const blooms = Array.from({ length: count }).map((_, i) => {
    const ring = i / count;
    const angle = (i / count) * Math.PI * 1.2 - Math.PI * 0.6 + (rand() - 0.5) * 0.35;
    const dist = 40 + rand() * 105;
    return {
      cx: 200 + Math.sin(angle) * dist * 1.05,
      cy: 205 - Math.cos(angle) * dist * 0.9 + ring * 6,
      r: 36 + rand() * 24,
      petals: 5 + Math.floor(rand() * 4),
      color: colors[Math.floor(rand() * colors.length)],
      rot: rand() * 360,
    };
  });
  const bg =
    tone === "dark"
      ? ["#1f191a", "#120f10"]
      : ["#efe6dd", "#e3d6ca"];

  return (
    <svg
      viewBox="0 0 400 500"
      role="img"
      aria-label="ภาพประกอบช่อดอกไม้"
      preserveAspectRatio="xMidYMid slice"
      className={cn("block h-full w-full", className)}
    >
      <defs>
        <linearGradient id={`bg-${seed}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
        <radialGradient id={`glow-${seed}`} cx="50%" cy="42%" r="45%">
          <stop offset="0" stopColor={colors[0]} stopOpacity={tone === "dark" ? 0.28 : 0.18} />
          <stop offset="1" stopColor={colors[0]} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="500" fill={`url(#bg-${seed})`} />
      <rect width="400" height="500" fill={`url(#glow-${seed})`} />
      {/* stems */}
      <g stroke="#4d6b45" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.9">
        {blooms.map((b, i) => (
          <path key={i} d={`M200 440 Q ${(200 + b.cx) / 2} ${(440 + b.cy) / 2 + 20} ${b.cx} ${b.cy}`} />
        ))}
      </g>
      {/* leaves */}
      {[-1, 1].map((s) => (
        <ellipse
          key={s}
          cx={200 + s * 62}
          cy={340}
          rx="16"
          ry="52"
          fill="#5d7f52"
          opacity="0.85"
          transform={`rotate(${s * 38} ${200 + s * 62} 340)`}
        />
      ))}
      {/* wrap */}
      <path d="M128 392 L272 392 L246 478 L154 478 Z" fill={tone === "dark" ? "#efe6dd" : "#fffdfb"} opacity="0.96" />
      <path d="M128 392 L200 430 L272 392" stroke={colors[0]} strokeWidth="2" fill="none" opacity="0.5" />
      {blooms
        .slice()
        .sort((a, b) => a.cy - b.cy)
        .map((b, i) => (
          <Bloom key={i} {...b} center="#e9c46a" />
        ))}
    </svg>
  );
}
