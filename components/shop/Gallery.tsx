"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Img = { id: string; url: string; alt: string };

export function Gallery({ images, name }: { images: Img[]; name: string }) {
  const [active, setActive] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const current = images[active];
  const hasThumbs = images.length > 1;

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };
  const goTo = (i: number) => {
    setActive(i);
    scroller.current?.scrollTo({ left: i * scroller.current.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="h-fit">
      {/* Phones and tablets: swipe between photos */}
      <div className="relative -mx-3 sm:mx-0 lg:hidden">
        <div
          ref={scroller}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-[var(--radius-panel)]"
          aria-label={`${name} photos`}
        >
          {images.length === 0 && <div className="aspect-[4/5] w-full shrink-0 bg-oat" />}
          {images.map((img, i) => (
            <div key={img.id} className="relative aspect-[4/5] w-full shrink-0 snap-center bg-oat sm:aspect-[3/4]">
              <Image
                src={img.url}
                alt={img.alt || name}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-[50%_25%]"
              />
            </div>
          ))}
        </div>
        {hasThumbs && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={`h-2 rounded-full bg-white shadow transition-all ${i === active ? "w-6" : "w-2 opacity-60"}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: thumbnails beside the main photo */}
      <div className={`hidden gap-4 lg:grid ${hasThumbs ? "lg:grid-cols-[80px_1fr]" : ""}`}>
        {hasThumbs && (
          <div className="flex flex-col gap-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                  i === active ? "border-olive" : "border-transparent opacity-70 hover:opacity-100"
                }`}
              >
                <Image src={img.url} alt="" fill sizes="80px" className="object-cover object-top" />
              </button>
            ))}
          </div>
        )}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[var(--radius-panel)] bg-oat">
          {current ? (
            <Image
              key={current.id}
              src={current.url}
              alt={current.alt || name}
              fill
              priority
              sizes="50vw"
              className="object-cover object-[50%_25%]"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
