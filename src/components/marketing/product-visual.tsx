import type { Locale } from "@/content/marketing";
import { marketingCopy } from "@/content/marketing";
import { Badge } from "@/components/marketing/badge";

type ProductVisualProps = {
  locale: Locale;
  compact?: boolean;
};

export function ProductVisual({ locale, compact = false }: ProductVisualProps) {
  const copy = marketingCopy[locale].preview;
  const primaryThread = copy.threads[0];

  return (
    <div
      aria-hidden="true"
      className={
        compact
          ? "rounded-lg border border-border bg-raised p-4 shadow-card"
          : "relative rounded-lg border border-border bg-raised p-4 shadow-soft"
      }
    >
      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-body-sm font-black">{copy.title}</p>
          <p className="mt-1 max-w-md text-caption leading-5 text-muted">
            {copy.subtitle}
          </p>
        </div>
        <Badge tone="teal">Northline</Badge>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="grid gap-3">
          {(compact ? copy.threads.slice(0, 2) : copy.threads).map((thread) => (
            <article
              key={thread.name}
              className="rounded-md border border-border bg-canvas p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body-sm font-black">{thread.name}</p>
                  <p className="mt-1 text-caption text-muted">{thread.channel}</p>
                </div>
                <span className="rounded-sm bg-teal-soft px-2 py-1 font-mono text-caption font-black text-teal-strong">
                  {thread.score}
                </span>
              </div>
              <p className="mt-3 text-caption leading-5 text-muted">
                {thread.summary}
              </p>
              <p className="mt-3 text-caption font-black text-blue">
                {thread.status}
              </p>
            </article>
          ))}
        </div>
        <div className="rounded-md border border-border bg-ink p-4 text-canvas">
          <p className="text-body-sm font-black">{copy.signalTitle}</p>
          <div className="mt-5 grid gap-3">
            {copy.signals.map((signal) => (
              <div
                key={signal}
                className="flex items-center gap-2 rounded-md bg-white/10 px-3 py-3 text-caption"
              >
                <span className="size-2 rounded-full bg-teal-soft" />
                <span>{signal}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-md bg-white/10 p-4">
            <p className="text-caption text-canvas/70">{copy.nextActionLabel}</p>
            <p className="mt-2 text-body-sm font-black">{copy.nextAction}</p>
          </div>
        </div>
      </div>
      {compact && primaryThread ? (
        <p className="mt-4 text-caption leading-5 text-muted">
          {primaryThread.summary}
        </p>
      ) : null}
    </div>
  );
}
