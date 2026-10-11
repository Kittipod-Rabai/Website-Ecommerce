/**
 * Minimal in-memory sliding-window rate limiter.
 * Fine for a single Node process; replace with Redis/Upstash when running
 * multiple instances (see DECISIONS.md).
 */
const hits = new Map<string, number[]>();

export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k);
  return true;
}
