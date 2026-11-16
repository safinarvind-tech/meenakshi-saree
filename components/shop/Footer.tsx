import Link from "next/link";
import { cacheLife } from "next/cache";
import { NewsletterForm } from "./NewsletterForm";

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/shop?category=kanchipuram", label: "Kanchipuram" },
      { href: "/shop?category=banarasi", label: "Banarasi" },
      { href: "/shop?category=soft-silk", label: "Soft silk" },
      { href: "/shop?category=bridal", label: "Bridal" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/policies/shipping", label: "Shipping" },
      { href: "/policies/returns", label: "Returns & exchanges" },
      { href: "/saree-care", label: "Saree care" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Visit",
    links: [
      { href: "/video-call", label: "Video-call shopping" },
      { href: "/our-story", label: "Our story" },
      { href: "/policies/privacy", label: "Privacy policy" },
      { href: "/policies/terms", label: "Terms of use" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mx-3 mt-20 rounded-t-[32px] bg-olive px-6 pt-12 pb-[max(32px,env(safe-area-inset-bottom))] sm:mt-24 sm:rounded-t-[36px] sm:pt-14 text-[#ede6d3] sm:mx-6 sm:px-12 lg:mx-10 lg:px-16 lg:pt-16">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12">
        <div className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-1">
          <h2 className="h-display text-[34px] leading-[1.05] sm:text-[46px]">
            Be the first to see
            <br />
            <em className="text-gold-light">new weaves.</em>
          </h2>
          <NewsletterForm />
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="min-w-0">
            <h3 className="mb-4 text-[13px] font-medium tracking-[0.18em] text-gold-light uppercase">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] opacity-80 transition-opacity hover:opacity-100">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-14 flex flex-col justify-between gap-2 border-t border-white/10 pt-6 text-[13px] opacity-60 sm:flex-row">
        <span>
          © <CurrentYear /> Sri Meenakshi Silk House
        </span>
        <span>Silk Mark Certified · Free shipping above ₹5,000</span>
      </div>
    </footer>
  );
}
