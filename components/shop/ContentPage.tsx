/** Simple text page layout for story, care and policy pages. */
export function ContentPage({ title, intro, children }: { title: React.ReactNode; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto mt-6 max-w-3xl px-3 sm:mt-12 sm:px-4">
      <h1 className="h-display text-[42px] leading-[1.02] sm:text-6xl">{title}</h1>
      {intro && <p className="mt-4 text-[17px] leading-relaxed text-muted sm:mt-5 sm:text-lg">{intro}</p>}
      <div className="mt-6 space-y-5 rounded-[24px] bg-white p-5 text-[16px] sm:mt-10 sm:rounded-[var(--radius-panel)] leading-relaxed sm:p-10 [&_h2]:mt-8 [&_h2]:font-serif [&_h2]:text-2xl [&_h2:first-child]:mt-0 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
        {children}
      </div>
    </article>
  );
}

/** Highlights text the client must confirm before launch. */
export function ToConfirm({ children }: { children: React.ReactNode }) {
  return <mark className="rounded bg-gold-light/40 px-1">{children}</mark>;
}
