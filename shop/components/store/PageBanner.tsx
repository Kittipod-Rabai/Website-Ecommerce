import Image from "next/image";

/** แบนเนอร์หัวหน้าแบบการ์ดมน ใช้กับหน้ารายการสินค้า */
export function PageBanner({
  eyebrow,
  title,
  sub,
  photo,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  photo: string;
}) {
  return (
    <section className="px-3 pt-3 sm:px-6 sm:pt-4">
      <div className="on-dark relative mx-auto mb-10 max-w-[1320px] overflow-hidden rounded-[2rem] bg-forest-deep text-snow">
        <Image src={`/photos/${photo}.jpg`} alt="" fill priority sizes="1320px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/50 to-ink/10" />
        <div className="relative px-6 pb-14 pt-36 sm:px-12 md:pt-40 lg:px-16">
          <p className="mb-3 text-sm text-[#f3b5c5]">{eyebrow}</p>
          <h1 className="display text-4xl sm:text-5xl lg:text-6xl">{title}</h1>
          {sub && <p className="mt-4 max-w-lg text-snow/80">{sub}</p>}
        </div>
      </div>
    </section>
  );
}
