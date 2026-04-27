"use client";

export default function KnowledgeError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-[520px] place-items-center rounded-lg border border-border bg-raised p-8 text-center shadow-card">
      <div>
        <h1 className="text-title-sm font-black">Knowledge could not load</h1>
        <p className="mt-3 max-w-md text-body-sm leading-6 text-muted">
          The business context editor hit an error while loading workspace data.
          Retry after confirming the preview database is available.
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
