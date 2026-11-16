import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <p className="font-serif text-8xl text-gold">404</p>
        <h1 className="h-display mt-4 text-4xl">This page has slipped off the loom.</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Link href="/shop" className="btn-primary mt-8">
          Browse sarees
        </Link>
      </div>
    </main>
  );
}
