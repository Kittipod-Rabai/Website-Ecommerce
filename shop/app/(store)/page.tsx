import Link from "next/link";
import { ArrowUpRight, Clock, Flower2, Gift, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import { ButtonLink } from "@/components/ui/Button";
import { FlowerArt } from "@/components/store/FlowerArt";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/store/Reveal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [occasions, all] = await Promise.all([
    db.occasion.findMany({ orderBy: { name: "asc" } }),
    listProducts({ sort: "popular" }),
  ]);
  const best = all.filter((p) => p.bestseller).slice(0, 4);
  const hero = all.find((p) => p.slug === "rouge-eternel") ?? all[0];

  return (
    <>
      {/* HERO */}
      <section className="on-dark relative isolate overflow-hidden bg-ink text-snow">
        <div className="container-x grid min-h-[100svh] items-center gap-6 pb-16 pt-32 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10">
            <p className="eyebrow mb-6 text-[#e8a0b0]">Fresh flowers · Delivered with care</p>
            <h1 className="display text-[clamp(3.2rem,8.2vw,7.5rem)]">
              ส่งความรู้สึก
              <br />
              <span className="italic text-[#e8a0b0]">ด้วยดอกไม้</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-relaxed text-snow/70">
              ช่อดอกไม้สดคัดสรรทุกเช้าโดยฟลอริสต์มืออาชีพ เลือกวันและช่วงเวลาที่อยากให้ถึงมือผู้รับได้เอง
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <ButtonLink href="/flowers" variant="solid">
                เลือกช่อดอกไม้
              </ButtonLink>
              <ButtonLink href="/flowers?sameDay=1" variant="outline" className="text-snow hover:bg-snow hover:text-ink hover:border-snow">
                ส่งวันนี้
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[560px] lg:max-w-none">
            <div className="absolute inset-0 animate-[float_9s_ease-in-out_infinite]">
              <FlowerArt seed="hero-rouge" palette={hero?.palette ?? []} tone="dark" className="rounded-none" />
            </div>
          </div>
        </div>
        <div className="container-x absolute bottom-6 left-0 right-0 hidden items-center justify-between text-[0.7rem] uppercase tracking-[0.22em] text-snow/45 lg:flex">
          <span>Scroll</span>
          <span>สั่งก่อน 14:00 น. ส่งได้ภายในวันนี้ (กรุงเทพฯ)</span>
        </div>
        <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}`}</style>
      </section>

      {/* OCCASIONS */}
      <section className="py-24 lg:py-32">
        <div className="container-x">
          <Reveal>
            <div className="mb-14 flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow mb-4 text-accent">Shop by occasion</p>
                <h2 className="display text-5xl lg:text-6xl">เลือกตามโอกาส</h2>
              </div>
              <Link href="/flowers" className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] sm:flex">
                ดูทั้งหมด <ArrowUpRight size={16} />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-px bg-[var(--line)] md:grid-cols-3 [&>*]:bg-paper">
            {occasions.map((o, i) => (
              <Reveal key={o.id} delay={i * 0.05}>
                <Link
                  href={`/occasions/${o.slug}`}
                  className="group relative flex h-full min-h-[200px] flex-col justify-between p-6 transition-colors duration-500 hover:!bg-ink hover:text-snow md:min-h-[260px] md:p-9"
                >
                  <span className="text-xs tabular-nums text-muted group-hover:text-snow/50">0{i + 1}</span>
                  <div>
                    <h3 className="display text-3xl md:text-4xl">{o.name}</h3>
                    <p className="mt-2 hidden text-sm text-muted group-hover:text-snow/60 md:block">{o.tagline}</p>
                  </div>
                  <ArrowUpRight className="absolute right-6 top-6 opacity-0 transition-opacity group-hover:opacity-100" size={20} />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="bg-paper-deep py-24 lg:py-32">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow mb-4 text-accent">Bestsellers</p>
            <h2 className="display mb-14 text-5xl lg:text-6xl">ช่อยอดนิยม</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
            {best.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.07}>
                <ProductCard p={p} />
              </Reveal>
            ))}
          </div>
          <div className="mt-16 text-center">
            <ButtonLink href="/flowers" variant="outline">
              ดูดอกไม้ทั้งหมด
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* PROMISE */}
      <section className="on-dark bg-ink py-24 text-snow lg:py-32">
        <div className="container-x">
          <Reveal>
            <h2 className="display mb-16 max-w-3xl text-5xl lg:text-6xl">
              สดใหม่ <span className="italic text-[#e8a0b0]">ตรงเวลา</span> ใส่ใจทุกช่อ
            </h2>
          </Reveal>
          <div className="grid gap-px bg-[var(--line-dark)] md:grid-cols-4 [&>*]:bg-ink">
            {[
              { icon: Flower2, t: "คัดสดทุกเช้า", d: "ดอกไม้นำเข้าและจากสวนไทย คัดเฉพาะดอกที่สมบูรณ์ที่สุดของวัน" },
              { icon: Clock, t: "เลือกเวลาส่งได้", d: "เลือกวันและช่วงเวลาจัดส่ง 3 ช่วงตลอดวัน เพื่อให้ถึงในจังหวะที่ใช่" },
              { icon: Truck, t: "ส่งวันเดียวกัน", d: "สั่งก่อน 14:00 น. ส่งถึงภายในวันนี้ ทั่วกรุงเทพฯ" },
              { icon: Gift, t: "การ์ดข้อความฟรี", d: "เขียนข้อความถึงผู้รับ หรือเลือกส่งแบบไม่ออกนามได้" },
            ].map(({ icon: Icon, t, d }, i) => (
              <Reveal key={t} delay={i * 0.08}>
                <div className="h-full p-8 lg:p-10">
                  <Icon size={28} strokeWidth={1.25} className="text-[#e8a0b0]" />
                  <h3 className="display mt-8 text-2xl">{t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-snow/60">{d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="py-24 lg:py-32">
        <div className="container-x grid items-center gap-14 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <div className="mx-auto aspect-[4/5] w-full max-w-[520px]">
              <FlowerArt seed="story-mille" palette={["#c4506b", "#e6b422", "#a583c4", "#f4efe8"]} />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow mb-4 text-accent">Our story</p>
            <h2 className="display text-5xl lg:text-6xl">
              ดอกไม้ที่ <span className="italic">เล่าเรื่อง</span> แทนคุณ
            </h2>
            <p className="mt-8 max-w-md leading-relaxed text-muted">
              Maison Fleur เริ่มจากความเชื่อที่ว่าดอกไม้หนึ่งช่อสามารถพูดแทนคำที่พูดไม่ออก
              เราจัดทุกช่อด้วยมือ ใช้เวลากับรายละเอียด ตั้งแต่การเลือกดอก สีของริบบิ้น ไปจนถึงการ์ดเล็กๆ ที่คุณเขียนถึงผู้รับ
            </p>
            <div className="mt-10">
              <ButtonLink href="/flowers" variant="outline">
                เริ่มเลือกช่อ
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
