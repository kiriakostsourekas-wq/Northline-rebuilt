import type { BusinessContextBundle } from "@/lib/knowledge/types";

export function ContextPreview({ bundle }: { bundle: BusinessContextBundle }) {
  const publishedCount = bundle.sections.reduce(
    (total, section) => total + section.entries.length,
    0,
  );

  return (
    <section className="rounded-lg border border-border bg-ink p-5 text-white shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-title-sm font-black">AI context bundle</h2>
          <p className="mt-2 text-body-sm leading-6 text-white/70">
            Generated from published knowledge only. Drafts stay out of the
            assistant context until approved.
          </p>
        </div>
        <div className="rounded-md bg-white/10 px-3 py-2 text-caption font-black">
          {publishedCount} published entries
        </div>
      </div>
      <pre className="mt-5 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border border-white/10 bg-black/24 p-4 text-caption leading-5 text-white/78">
        {bundle.assistantContext}
      </pre>
    </section>
  );
}
