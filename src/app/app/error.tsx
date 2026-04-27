"use client";

export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[520px] place-items-center rounded-lg border border-border bg-raised p-8 text-center shadow-card">
      <div>
        <p className="text-caption font-black uppercase text-muted">
          Workspace error
        </p>
        <h1 className="mt-2 text-title-sm font-black">
          This workspace view could not load
        </h1>
        <p className="mt-3 max-w-md text-body-sm leading-6 text-muted">
          Confirm the preview database is available and the latest migrations
          have been applied, then retry the page.
        </p>
        <button
          onClick={reset}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-3 text-body-sm font-black text-white"
          type="button"
        >
          Retry
        </button>
      </div>
    </main>
  );
}
