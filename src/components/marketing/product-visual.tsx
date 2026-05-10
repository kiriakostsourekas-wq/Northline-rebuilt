import {
  CalendarCheck,
  CheckCircle2,
  DatabaseZap,
  Languages,
  MessageCircle,
  UserCheck,
} from "lucide-react";
import type { Locale } from "@/content/marketing";
import { marketingCopy } from "@/content/marketing";
import { Badge } from "@/components/marketing/badge";
import { cn } from "@/lib/utils";

type ProductVisualProps = {
  locale: Locale;
  compact?: boolean;
};

const previewDetails: Record<
  Locale,
  {
    activeLead: string;
    owner: string;
    qualification: Array<{ label: string; value: string; complete: boolean }>;
    handoff: string[];
  }
> = {
  en: {
    activeLead: "Consultation this week",
    owner: "Sales handoff: ready",
    qualification: [
      { label: "Need", value: "Pricing + consultation", complete: true },
      { label: "Timing", value: "This week", complete: true },
      { label: "Language", value: "English", complete: true },
      { label: "Consent", value: "Confirmed", complete: true },
    ],
    handoff: [
      "Asked for package options",
      "Interested in an appointment",
      "Send booking link or route to sales",
    ],
  },
  el: {
    activeLead: "Consultation μέσα στην εβδομάδα",
    owner: "Sales handoff: έτοιμο",
    qualification: [
      { label: "Ανάγκη", value: "Τιμές + consultation", complete: true },
      { label: "Χρόνος", value: "Αυτή την εβδομάδα", complete: true },
      { label: "Γλώσσα", value: "Ελληνικά", complete: true },
      { label: "Consent", value: "Επιβεβαιωμένο", complete: true },
    ],
    handoff: [
      "Ζήτησε διαθέσιμα πακέτα",
      "Θέλει appointment",
      "Στείλτε booking link ή route σε sales",
    ],
  },
};

const statusClassNames = [
  "bg-teal-soft text-teal-strong",
  "bg-blue-soft text-blue",
  "bg-amber-soft text-amber-strong",
];

export function ProductVisual({ locale, compact = false }: ProductVisualProps) {
  const copy = marketingCopy[locale].preview;
  const detail = previewDetails[locale];
  const primaryThread = copy.threads[0];

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative min-w-0 overflow-hidden rounded-lg border border-border bg-raised shadow-soft",
        compact ? "p-3 sm:p-4" : "p-4 sm:p-5",
      )}
    >
      <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(var(--color-ink)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <p className="text-caption font-black uppercase text-muted">
              Northline
            </p>
            <h3 className="mt-1 text-body-sm font-black">{copy.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone="teal" className="hidden sm:inline-flex">
              Live lead
            </Badge>
            <span className="grid size-9 place-items-center rounded-md bg-teal-soft text-teal-strong">
              <Languages aria-hidden="true" className="size-4" />
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.86fr_1.14fr]">
          <div className="min-w-0 overflow-hidden rounded-md border border-border bg-canvas">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle aria-hidden="true" className="size-4 text-teal" />
                <p className="text-caption font-black uppercase text-muted">
                  Inbox
                </p>
              </div>
              <span className="rounded-sm bg-raised px-2 py-1 font-mono text-caption font-black text-muted">
                3 leads
              </span>
            </div>
            <div className="divide-y divide-border">
              {copy.threads.map((thread, index) => (
                <article
                  key={thread.name}
                  className={cn(
                    "p-4",
                    index === 0 ? "bg-raised" : "bg-canvas",
                    compact && index === 2 && "hidden sm:block",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-body-sm font-black">{thread.name}</p>
                      <p className="mt-1 text-caption text-muted">
                        {thread.channel}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-sm px-2 py-1 font-mono text-caption font-black",
                        statusClassNames[index] ?? statusClassNames[0],
                      )}
                    >
                      {thread.score}
                    </span>
                  </div>
                  <p className="mt-3 text-caption leading-5 text-muted">
                    {thread.summary}
                  </p>
                  <p className="mt-3 text-caption font-black text-ink">
                    {thread.status}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid min-w-0 gap-4">
            <div className="rounded-md border border-border bg-canvas p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-caption font-black uppercase text-muted">
                    Selected lead
                  </p>
                  <h3 className="mt-1 text-title-sm font-black leading-tight">
                    {primaryThread?.name ?? copy.title}
                  </h3>
                </div>
                <Badge tone="blue">{detail.owner}</Badge>
              </div>
              <p className="mt-4 text-body-sm leading-6 text-muted">
                {primaryThread?.summary ?? copy.subtitle}
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {detail.qualification.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-md border border-border bg-raised p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-caption font-black uppercase text-muted">
                        {item.label}
                      </p>
                      {item.complete ? (
                        <CheckCircle2
                          aria-hidden="true"
                          className="size-4 text-teal"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 text-caption font-black text-ink">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-md border border-teal/25 bg-teal-soft p-4 text-teal-strong">
                <div className="flex items-center gap-2">
                  <CalendarCheck aria-hidden="true" className="size-4" />
                  <p className="text-caption font-black uppercase">
                    {copy.nextActionLabel}
                  </p>
                </div>
                <p className="mt-3 text-body-sm font-black">{copy.nextAction}</p>
                <p className="mt-2 text-caption leading-5">
                  {detail.activeLead}
                </p>
              </div>

              <div className="rounded-md border border-border bg-ink p-4 text-canvas">
                <div className="flex items-center gap-2">
                  <UserCheck aria-hidden="true" className="size-4 text-teal-soft" />
                  <p className="text-caption font-black uppercase text-canvas/70">
                    Handoff packet
                  </p>
                </div>
                <ul className="mt-3 grid gap-2">
                  {detail.handoff.map((item) => (
                    <li key={item} className="flex gap-2 text-caption leading-5">
                      <DatabaseZap
                        aria-hidden="true"
                        className="mt-0.5 size-3.5 shrink-0 text-teal-soft"
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
