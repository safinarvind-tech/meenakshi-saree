import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, BadgeCheck, Sparkles, Truck, Video } from "lucide-react";
import { getNewArrivals } from "@/lib/catalog";
import { ProductCard, ProductGridSkeleton } from "@/components/shop/ProductCard";

const CATEGORY_PILLS = [
  { href: "/shop", label: "All sarees" },
  { href: "/shop?category=kanchipuram", label: "Kanchipuram" },
  { href: "/shop?category=banarasi", label: "Banarasi" },
  { href: "/shop?category=soft-silk", label: "Soft silk" },
  { href: "/shop?category=tissue", label: "Tissue" },
  { href: "/shop?category=bridal", label: "Bridal" },
  { href: "/shop?max=15000", label: "Under ₹15,000" },
];

const STEPS = [
  { img: "/brand/fabric-orange.jpg", title: "Woven by hand", text: "Every saree takes 80 to 200 hours on a traditional pit loom." },
  { img: "/brand/stack.jpg", title: "Checked by family", text: "Silk Mark certified, zari purity tested before it reaches you." },
  { img: "/brand/bangles.jpg", title: "Delivered with care", text: "Gift-ready packaging and free insured shipping across India." },
];

const TRUST = [
  { icon: BadgeCheck, title: "Silk Mark certified", text: "Every pure silk saree carries its Silk Mark label." },
  { icon: Sparkles, title: "Direct from weavers", text: "No middlemen. Fair prices for weavers and for you." },
  { icon: Video, title: "See it live first", text: "Book a video call and see the saree before you buy." },
  { icon: Truck, title: "Free shipping", text: "Free insured delivery across India on orders above ₹5,000." },
];

async function NewArrivals() {
  const products = await getNewArrivals(4);
  if (products.length === 0) {
    return <p className="rounded-[var(--radius-card)] bg-white p-10 text-center text-muted">New sarees are on the loom. Check back soon.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-3 mt-3 grid gap-3 sm:mx-6 sm:mt-5 sm:gap-5 lg:mx-10 lg:h-[760px] lg:grid-cols-2">
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-olive p-7 text-paper sm:rounded-[var(--radius-panel)] sm:p-12 lg:p-16">
          <div aria-hidden className="absolute -right-28 -bottom-28 size-96 rounded-full border border-gold/35 shadow-[0_0_0_40px_rgba(184,147,80,0.05)]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2.5 rounded-full bg-white/10 py-2 pr-4 pl-2 text-sm">
              <span className="grid size-6 place-items-center rounded-full bg-gold text-[13px] text-olive">✦</span>
              New · The Wedding Edit 2026
            </span>
            <h1 className="h-display mt-7 text-[52px] leading-[0.98] sm:mt-8 sm:text-7xl lg:text-8xl">
              Silk that
              <br />
              feels like <em className="text-gold-light">home.</em>
            </h1>
            <p className="mt-5 max-w-[430px] text-[17px] leading-relaxed font-light opacity-80 sm:mt-7 sm:text-lg">
              Handwoven Kanchipuram silks, made slowly by weaver families we have known for fifty years.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:mt-9">
              <Link href="/shop" className="btn-light">
                Shop the edit <ArrowRight className="size-4" />
              </Link>
              <Link href="/video-call" className="btn border border-paper/40 text-paper hover:bg-white/10">
                Book a video call
              </Link>
            </div>
          </div>
          <p className="relative mt-10 text-sm opacity-80 sm:mt-12">
            <span className="font-serif text-xl text-gold-light">Since 1972</span> · Three generations of Kanchipuram silk
          </p>
        </div>
        <div className="relative min-h-[480px] overflow-hidden rounded-[28px] sm:min-h-[520px] sm:rounded-[var(--radius-panel)]">
          <Image
            src="/brand/bride-trees.jpg"
            alt="Bride in a pink and red Kanchipuram silk saree"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[50%_25%]"
          />
          <span className="absolute top-4 right-4 rounded-full bg-terra px-3.5 py-2 text-[11px] tracking-[0.08em] text-white sm:top-6 sm:right-6 sm:px-4 sm:text-xs">HANDWOVEN · PURE ZARI</span>
          <Link
            href="/shop?category=bridal"
            className="absolute right-3 bottom-3 left-3 flex items-center justify-between gap-3 rounded-[22px] bg-white/80 p-4 backdrop-blur-md sm:right-6 sm:bottom-6 sm:left-6"
          >
            <span className="min-w-0">
              <span className="block font-serif text-lg sm:text-xl">The Bridal Collection</span>
              <span className="block text-[13px] text-muted sm:text-sm">Heirloom Kanjivarams for your big day</span>
            </span>
            <span className="btn-primary shrink-0 px-4 py-2.5 text-sm sm:px-5">Explore</span>
          </Link>
        </div>
      </section>

      {/* Category pills */}
      <nav
        className="no-scrollbar mt-8 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-4 sm:mt-12 sm:flex-wrap sm:justify-center sm:gap-3 sm:overflow-visible sm:px-0"
        aria-label="Categories"
      >
        {CATEGORY_PILLS.map((c, i) => (
          <Link
            key={c.href}
            href={c.href}
            className={`shrink-0 rounded-full border px-5 py-2.5 text-[15px] whitespace-nowrap transition-colors sm:px-6 sm:py-3 ${
              i === 0 ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"
            }`}
          >
            {c.label}
          </Link>
        ))}
      </nav>

      {/* Bento */}
      <section className="mx-3 mt-16 sm:mx-6 sm:mt-24 lg:mx-10">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:mb-9 sm:flex-row sm:items-end sm:gap-4">
          <h2 className="h-display text-[40px] leading-none sm:text-6xl">
            Find your <em className="text-terra">weave</em>
          </h2>
          <p className="max-w-[360px] leading-relaxed text-muted">
            Each collection is curated by our family, from everyday soft silks to heirloom bridal Kanjivarams.
          </p>
        </div>
        <div className="grid auto-rows-[210px] grid-cols-2 gap-3 sm:auto-rows-[260px] sm:gap-5 lg:auto-rows-[330px] lg:grid-cols-4">
          <BentoTile href="/shop?category=bridal" img="/brand/bride-mustard.jpg" label="Bridal Kanjivaram" className="col-span-2 row-span-2" />
          <BentoTile href="/shop?category=kanchipuram" img="/brand/fabric-purple.jpg" label="Pure zari, tested" className="col-span-2" />
          <BentoTile href="/shop?category=soft-silk" img="/brand/green-silver.jpg" label="Soft silk" />
          <Link href="/video-call" className="flex flex-col justify-between rounded-[22px] bg-terra p-5 text-[#fbefe6] sm:rounded-[28px] sm:p-9">
            <h3 className="h-display text-[23px] leading-[1.08] sm:text-3xl lg:text-[40px]">
              Shop live with a <em>stylist</em> on video call.
            </h3>
            <span className="btn self-start bg-[#fbefe6] px-4 py-2 text-sm whitespace-nowrap text-terra sm:px-6 sm:py-3 sm:text-[15px]">Book a slot →</span>
          </Link>
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-3 mt-16 sm:mx-6 sm:mt-24 lg:mx-10">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-9">
          <h2 className="h-display text-[40px] leading-none sm:text-6xl">
            New this <em className="text-terra">week</em>
          </h2>
          <Link href="/shop" className="btn-outline hidden sm:inline-flex">
            View all sarees →
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <NewArrivals />
        </Suspense>
        <Link href="/shop" className="btn-outline mt-6 w-full sm:hidden">
          View all sarees →
        </Link>
      </section>

      {/* Craft */}
      <section className="mx-3 mt-16 overflow-hidden rounded-[28px] bg-oat py-7 sm:mx-6 sm:mt-28 sm:rounded-[36px] sm:p-12 lg:mx-10 lg:p-16">
        <div className="mb-7 flex flex-col justify-between gap-5 px-6 sm:mb-8 sm:flex-row sm:items-end sm:px-0">
          <h2 className="h-display max-w-[640px] text-4xl leading-[1.02] sm:text-[58px]">
            From the loom to your <em className="text-terra">wardrobe</em>, honestly.
          </h2>
          <Link href="/our-story" className="btn-primary self-start">
            Our story →
          </Link>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-6 px-6 sm:px-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {STEPS.map((s, i) => (
            <article key={s.title} className="w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl bg-cream sm:w-[45%] md:w-auto">
              <div className="relative h-44 sm:h-60">
                <Image src={s.img} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
              </div>
              <div className="p-5 sm:p-6">
                <span className="font-serif text-xl text-terra italic">0{i + 1}</span>
                <h3 className="mt-1 mb-2 font-serif text-2xl sm:text-[28px]">{s.title}</h3>
                <p className="leading-relaxed text-muted">{s.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-3 mt-16 sm:mx-6 sm:mt-24 lg:mx-10">
        <h2 className="h-display mb-6 text-[40px] leading-none sm:mb-9 sm:text-6xl">
          Why families <em className="text-terra">trust</em> us
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-[22px] bg-white p-5 sm:rounded-[var(--radius-card)] sm:p-8">
              <Icon className="size-7 text-gold sm:size-8" strokeWidth={1.4} />
              <h3 className="mt-4 font-serif text-lg leading-snug sm:mt-5 sm:text-2xl">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted sm:mt-2 sm:text-base">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function BentoTile({ href, img, label, className = "" }: { href: string; img: string; label: string; className?: string }) {
  return (
    <Link href={href} className={`group relative overflow-hidden rounded-[22px] sm:rounded-[28px] ${className}`}>
      <Image src={img} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-[50%_25%] transition-transform duration-500 group-hover:scale-[1.03]" />
      <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-white/90 py-2 pr-2 pl-3.5 text-sm font-medium whitespace-nowrap backdrop-blur sm:bottom-4 sm:left-4 sm:gap-2.5 sm:py-2.5 sm:pr-2.5 sm:pl-4 sm:text-[15px]">
        {label}
        <span className="grid size-6 place-items-center rounded-full bg-ink text-xs text-white">→</span>
      </span>
    </Link>
  );
}
