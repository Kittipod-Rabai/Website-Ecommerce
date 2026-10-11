import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check, Clock, Flower2, Gift, Star, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import { ButtonLink } from "@/components/ui/Button";
import { ProductCard } from "@/components/store/ProductCard";
import { Reveal } from "@/components/store/Reveal";

export const dynamic = "force-dynamic";

const OCCASION_PHOTO: Record<string, string> = {
  birthday: "sunflower-mix",
  valentine: "red-vase",
  congrats: "sunflower-wrap",
  "thank-you": "peach-bouquet",
  "get-well": "sunflower-vase",
  sympathy: "white-wrap",
};

const AVATARS = ["#c8456b", "#e9a23b", "#24503a", "#8a6bbf"];

export default async function HomePage() {
  const [occasions, all] = await Promise.all([
    db.occasion.findMany({ orderBy: { name: "asc" } }),
    listProducts({ sort: "popular" }),
  ]);
  const best = all.filter((p) => p.bestseller).slice(0, 4);

  return (
    <>
      {/* HERO */}
      <section className="px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="on-dark relative mx-auto max-w-[1320px] overflow-hidden rounded-[2rem] bg-forest-deep text-snow">
          <Image
            src="/photos/flower-shop-xl.jpg"
            alt="ร้านดอกไม้สดหลากสี"
            fill
            priority
            sizes="1320px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/10" />
          <div className="relative px-6 pb-48 pt-36 sm:px-12 md:pb-56 md:pt-44 lg:px-16">
            <Reveal>
              <h1 className="display max-w-2xl text-[clamp(2.4rem,5.6vw,4.6rem)]">
                ส่งความรู้สึกด้วย
                <br />
                ดอกไม้สดใหม่ทุกช่อ
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-6 max-w-md text-base leading-relaxed text-snow/80">
                ช่อดอกไม้จัดโดยฟลอริสต์มืออาชีพ เลือกวันและช่วงเวลาที่อยากให้ถึงมือผู้รับได้เอง ส่งทั่วกรุงเทพฯ และปริมณฑล
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/flowers">เลือกช่อดอกไม้</ButtonLink>
                <ButtonLink href="/occasions/valentine" variant="light" arrow={false}>
                  ดอกไม้ตามโอกาส
                </ButtonLink>
              </div>
            </Reveal>
          </div>

          {/* floating cards */}
          <div className="absolute inset-x-4 bottom-4 hidden gap-4 sm:inset-x-8 sm:bottom-8 md:grid md:grid-cols-[1.1fr_1fr_0.8fr] lg:inset-x-12 lg:bottom-10">
            <div className="relative flex h-40 items-end overflow-hidden rounded-3xl">
              <Image src="/photos/florist-arranging.jpg" alt="ฟลอริสต์กำลังจัดช่อ" fill sizes="400px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
              <p className="relative p-4 text-sm leading-snug text-white">จัดด้วยมือทุกช่อ ใส่ใจทุกรายละเอียด ตั้งแต่ดอกไม้จนถึงริบบิ้น</p>
            </div>
            <div className="flex h-40 flex-col justify-between rounded-3xl bg-white p-5 text-ink">
              <div>
                <p className="display text-3xl">2,500+</p>
                <p className="text-sm text-muted">ออเดอร์ที่ส่งถึงมือแล้ว</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {AVATARS.map((c) => (
                    <span key={c} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c }} />
                  ))}
                </div>
                <p className="flex items-center gap-1 text-sm font-medium">
                  <Star size={15} className="fill-[#e9a23b] text-[#e9a23b]" /> 4.9
                </p>
              </div>
            </div>
            <div className="relative hidden h-40 overflow-hidden rounded-3xl lg:block">
              <Image src="/photos/sunflower-wrap.jpg" alt="ช่อทานตะวัน" fill sizes="300px" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="container-x py-20 lg:py-28">
        <Reveal>
          <h2 className="display max-w-4xl text-3xl leading-snug sm:text-4xl lg:text-5xl">
            เราคัดดอกไม้สดทุกเช้า <span className="text-muted">จัดช่อด้วยมือ และส่งตรงเวลา เพื่อให้ทุกโอกาสพิเศษของคุณ</span>{" "}
            <span className="text-accent">ถึงมือผู้รับอย่างสมบูรณ์แบบ</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <Reveal>
            <div className="grid h-full overflow-hidden rounded-[2rem] bg-paper-deep md:grid-cols-2">
              <div className="relative min-h-72">
                <Image src="/photos/florist-woman.jpg" alt="ฟลอริสต์ถือช่อดอกไม้" fill sizes="400px" className="object-cover" />
              </div>
              <div className="p-8">
                <h3 className="display text-2xl">ทำไมต้อง Maison Fleur</h3>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "ดอกไม้สดนำเข้าและจากสวนไทย",
                    "เลือกวัน-เวลาจัดส่งได้ 3 ช่วงตลอดวัน",
                    "สั่งก่อน 14:00 น. ส่งได้ภายในวันนี้",
                    "การ์ดข้อความฟรี ส่งแบบไม่ออกนามได้",
                    "ติดตามสถานะออเดอร์ได้ตลอด",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                        <Check size={12} />
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <ButtonLink href="/flowers" variant="forest">เริ่มเลือกช่อ</ButtonLink>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="on-dark flex h-full flex-col justify-between rounded-[2rem] bg-forest p-8 text-snow">
              <div>
                <h3 className="display text-2xl">สดใหม่ ตรงเวลา ใส่ใจทุกช่อ</h3>
                <p className="mt-3 text-sm leading-relaxed text-snow/70">
                  คิวจัดส่งจำกัดต่อวัน เพื่อให้ทุกช่อได้รับการจัดอย่างพิถีพิถัน ไม่รีบ ไม่เร่ง
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/15 pt-6">
                {[
                  ["20+", "แบบช่อให้เลือก"],
                  ["3", "ช่วงเวลาจัดส่ง"],
                  ["4.9", "คะแนนความพึงพอใจ"],
                  ["98%", "ส่งตรงเวลา"],
                ].map(([n, l]) => (
                  <div key={l}>
                    <p className="display text-4xl">{n}</p>
                    <p className="text-xs text-snow/65">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* OCCASIONS */}
      <section className="container-x pb-20 lg:pb-28">
        <Reveal>
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2 text-accent">เลือกตามโอกาส</p>
              <h2 className="display text-3xl sm:text-4xl lg:text-5xl">ดอกไม้สำหรับทุกความรู้สึก</h2>
            </div>
            <ButtonLink href="/flowers" variant="outline">ดูทั้งหมด</ButtonLink>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {occasions.map((o, i) => (
            <Reveal key={o.id} delay={i * 0.05}>
              <Link href={`/occasions/${o.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-3xl bg-paper-deep">
                <Image
                  src={`/photos/${OCCASION_PHOTO[o.slug] ?? "rose-bouquet"}.jpg`}
                  alt={o.name}
                  fill
                  sizes="(min-width:1024px) 33vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                  <div>
                    <h3 className="display text-xl sm:text-2xl">{o.name}</h3>
                    <p className="mt-1 hidden text-xs text-white/75 sm:block">{o.tagline}</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BESTSELLERS */}
      <section className="bg-blush py-20 lg:py-28">
        <div className="container-x">
          <Reveal>
            <p className="eyebrow mb-2 text-accent">ช่อยอดนิยม</p>
            <h2 className="display mb-10 text-3xl sm:text-4xl lg:text-5xl">ขายดีที่สุดของร้าน</h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4 lg:gap-x-6">
            {best.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.07}>
                <ProductCard p={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROMISES */}
      <section className="container-x py-20 lg:py-28">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Flower2, t: "คัดสดทุกเช้า", d: "เลือกเฉพาะดอกที่สมบูรณ์ที่สุดของวัน" },
            { icon: Clock, t: "เลือกเวลาส่งได้", d: "เลือกวันและช่วงเวลาให้ถึงในจังหวะที่ใช่" },
            { icon: Truck, t: "ส่งวันเดียวกัน", d: "สั่งก่อน 14:00 น. ส่งถึงภายในวันนี้" },
            { icon: Gift, t: "การ์ดข้อความฟรี", d: "เขียนข้อความถึงผู้รับ หรือส่งแบบไม่ออกนาม" },
          ].map(({ icon: Icon, t, d }, i) => (
            <Reveal key={t} delay={i * 0.06}>
              <div className="h-full rounded-3xl border border-[var(--line)] p-7 transition-colors hover:bg-blush">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blush text-accent">
                  <Icon size={22} strokeWidth={1.5} />
                </span>
                <h3 className="display mt-6 text-lg">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section className="container-x pb-20 lg:pb-28">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-paper-deep lg:grid-cols-2">
          <Reveal>
            <div className="p-8 sm:p-12 lg:p-16">
              <p className="eyebrow mb-3 text-accent">เรื่องราวของเรา</p>
              <h2 className="display text-3xl sm:text-4xl lg:text-5xl">ดอกไม้ที่เล่าเรื่องแทนคุณ</h2>
              <p className="mt-6 max-w-md leading-relaxed text-muted">
                Maison Fleur เริ่มจากความเชื่อว่าดอกไม้หนึ่งช่อสามารถพูดแทนคำที่พูดไม่ออก เราจัดทุกช่อด้วยมือ
                ใช้เวลากับรายละเอียด ตั้งแต่การเลือกดอก สีริบบิ้น ไปจนถึงการ์ดเล็กๆ ที่คุณเขียนถึงผู้รับ
              </p>
              <div className="mt-8">
                <ButtonLink href="/flowers">เลือกช่อดอกไม้</ButtonLink>
              </div>
            </div>
          </Reveal>
          <div className="relative min-h-80 lg:h-full lg:min-h-[480px]">
            <Image src="/photos/florist-hands-xl.jpg" alt="ฟลอริสต์จัดดอกไม้" fill sizes="660px" className="object-cover" />
          </div>
        </div>
      </section>
    </>
  );
}
