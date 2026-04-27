"use client";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[520px] place-items-center rounded-lg border border-border bg-raised p-8 text-center shadow-card">
      <div>
        <p className="text-caption font-black uppercase text-muted">
          Analytics error
        </p>
        <h1 className="mt-2 text-title-sm font-black">
          Dashboard could not load
        </h1>
        <p className="mt-3 max-w-md text-body-sm leading-6 text-muted">
          The analytics view needs the preview database and latest migrations.
          Retry after confirming local or preview data access.
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-3 text-body-sm font-black text-white"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
