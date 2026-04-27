import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-canvas px-6 py-16 text-ink">
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Northline
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.02em] md:text-5xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">
          The page may have moved, or the preview route may not exist in this
          rebuild yet.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="rounded-md bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ink/90"
            href="/"
          >
            Go to website
          </Link>
          <Link
            className="rounded-md border border-border bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface"
            href="/app/dashboard"
          >
            Open dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
