import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cable, RotateCcw, Send, ShieldCheck } from "lucide-react";
import {
  replayDeliveryAttemptAction,
  saveWebhookDestinationAction,
} from "@/app/app/destinations/actions";
import { NoticeBanner } from "@/components/app/notice-banner";
import { Badge } from "@/components/marketing/badge";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import {
  type DestinationsPageData,
  getDestinationsPageData,
} from "@/server/destinations/queries";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Northline outbound destinations, webhook delivery logs, and lead export pipeline.",
};

export const dynamic = "force-dynamic";

type DestinationsPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    notice?: string | string[];
  }>;
};

export default async function DestinationsPage({
  searchParams,
}: DestinationsPageProps) {
  const query = (await searchParams) ?? {};
  const error = normalizeParam(query.error);
  const notice = destinationsNoticeMessage(normalizeParam(query.notice));
  const { organization, user } = await requireCompletedOnboarding();
  const canManage = user.role === "OWNER" || user.role === "ADMIN";
  const data = await getDestinationsPageData({
    organizationId: organization.id,
  });
  const webhook = data.destinations.find(
    (destination) => destination.provider === "WEBHOOK",
  );
  const failedCount = data.attempts.filter(
    (attempt) => attempt.status === "FAILED" || attempt.status === "RETRYING",
  ).length;

  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
          <div>
            <Badge tone="teal">Outbound destinations</Badge>
            <h1 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              Deliver qualified leads to business systems
            </h1>
            <p className="mt-3 max-w-3xl text-body-sm leading-6 text-muted">
              Configure webhook delivery first, keep a structured payload
              preview visible, and replay failed exports without requalifying a
              lead.
            </p>
          </div>
          <div className="grid gap-3 rounded-md border border-border bg-canvas p-4">
            <MetricRow label="Destinations" value={String(data.destinations.length)} />
            <MetricRow label="Delivery attempts" value={String(data.attempts.length)} />
            <MetricRow label="Needs attention" value={String(failedCount)} />
          </div>
        </div>
      </section>

      {error ? (
        <NoticeBanner tone="error">{error}</NoticeBanner>
      ) : null}
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="grid gap-6">
          <WebhookConfiguration
            destination={webhook}
            canManage={canManage}
          />
          <DeliveryLog attempts={data.attempts} canManage={canManage} />
        </div>
        <aside className="grid h-fit gap-6 2xl:sticky 2xl:top-24">
          <PayloadPreview payload={data.previewPayload} />
          <DestinationList destinations={data.destinations} />
        </aside>
      </section>
    </main>
  );
}

function WebhookConfiguration({
  destination,
  canManage,
}: {
  destination: DestinationsPageData["destinations"][number] | undefined;
  canManage: boolean;
}) {
  const eventTypes = new Set(destination?.eventTypes ?? []);
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={Cable}
        title="Webhook destination"
        body="Northline signs webhook requests when a shared secret is configured."
      />
      <form action={saveWebhookDestinationAction} className="mt-5 grid gap-4">
        <input type="hidden" name="destinationId" value={destination?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input
              name="name"
              required
              defaultValue={destination?.name ?? "Primary webhook"}
              className={inputClassName}
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={destination?.status ?? "ACTIVE"}
              className={inputClassName}
            >
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DISABLED">Disabled</option>
            </select>
          </Field>
        </div>
        <Field label="Endpoint URL">
          <input
            name="endpointUrl"
            required
            type="url"
            placeholder="https://example.com/northline/webhook"
            defaultValue={destination?.endpointUrl ?? ""}
            className={inputClassName}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Signing secret">
            <input
              name="secret"
              type="password"
              placeholder={
                destination?.secretLast4
                  ? `Stored secret ending ${destination.secretLast4}`
                  : "Optional shared secret"
              }
              className={inputClassName}
            />
          </Field>
          <Field label="Max attempts">
            <input
              name="maxAttempts"
              type="number"
              min={1}
              max={8}
              defaultValue={destination?.maxAttempts ?? 3}
              className={inputClassName}
            />
          </Field>
        </div>
        <Field label="Additional headers JSON">
          <textarea
            name="headers"
            rows={4}
            defaultValue={jsonText(destination?.headers)}
            placeholder='{"X-CRM-Source":"northline"}'
            className={textareaClassName}
          />
        </Field>
        <div className="grid gap-2 rounded-md border border-border bg-canvas p-3">
          <p className="text-caption font-black uppercase text-muted">Events</p>
          <Checkbox
            name="eventTypes"
            value="LEAD_QUALIFIED"
            defaultChecked={
              eventTypes.size === 0 || eventTypes.has("LEAD_QUALIFIED")
            }
          >
            Qualified lead
          </Checkbox>
          <Checkbox
            name="eventTypes"
            value="BOOKING_CONFIRMED"
            defaultChecked={
              eventTypes.size === 0 || eventTypes.has("BOOKING_CONFIRMED")
            }
          >
            Confirmed booking
          </Checkbox>
        </div>
        <Checkbox
          name="includeRawConversation"
          defaultChecked={destination?.includeRawConversation ?? false}
        >
          Include display conversation messages in payload snapshots
        </Checkbox>
        <button disabled={!canManage} className={primaryButtonClassName}>
          Save webhook
        </button>
      </form>
    </section>
  );
}

function DeliveryLog({
  attempts,
  canManage,
}: {
  attempts: DestinationsPageData["attempts"];
  canManage: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={Send}
        title="Delivery log"
        body="Every destination attempt is recorded with status, response, and retry state."
      />
      <div className="mt-5 overflow-x-auto">
        {attempts.length ? (
          <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-caption">
            <thead>
              <tr className="text-muted">
                <Th>Destination</Th>
                <Th>Event</Th>
                <Th>Lead</Th>
                <Th>Status</Th>
                <Th>Response</Th>
                <Th>Created</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="border-t border-border">
                  <Td>
                    <span className="font-black text-ink">
                      {attempt.destination.name}
                    </span>
                    <span className="block text-muted">
                      {formatEnum(attempt.destination.provider)}
                    </span>
                  </Td>
                  <Td>{formatEnum(attempt.export.eventType)}</Td>
                  <Td>
                    {attempt.export.lead.fullName ||
                      attempt.export.lead.email ||
                      attempt.export.lead.phone ||
                      "Unknown lead"}
                  </Td>
                  <Td>
                    <span className={statusPillClassName(attempt.status)}>
                      {formatEnum(attempt.status)}
                    </span>
                  </Td>
                  <Td>
                    {attempt.responseStatus ?? "none"}
                    {attempt.errorMessage ? (
                      <span className="block max-w-[220px] truncate text-rose">
                        {attempt.errorMessage}
                      </span>
                    ) : null}
                  </Td>
                  <Td>{formatDate(attempt.createdAt)}</Td>
                  <Td>
                    {attempt.status === "FAILED" ||
                    attempt.status === "RETRYING" ? (
                      <form action={replayDeliveryAttemptAction}>
                        <input type="hidden" name="attemptId" value={attempt.id} />
                        <button
                          disabled={!canManage}
                          className={secondaryButtonClassName}
                        >
                          Replay
                        </button>
                      </form>
                    ) : (
                      <span className="font-bold text-muted">No action</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyCard text="No delivery attempts yet. Qualified leads and confirmed bookings will appear here after a destination is active." />
        )}
      </div>
    </section>
  );
}

function PayloadPreview({ payload }: { payload: unknown }) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={ShieldCheck}
        title="Payload preview"
        body="The webhook body is stable JSON with a Northline idempotency key."
      />
      <pre className="mt-4 max-h-[560px] overflow-auto rounded-md bg-ink p-4 text-[0.72rem] leading-5 text-white">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </section>
  );
}

function DestinationList({
  destinations,
}: {
  destinations: DestinationsPageData["destinations"];
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={RotateCcw}
        title="Configured destinations"
        body="Webhook is live first; CRM adapters are stubbed for future providers."
      />
      <div className="mt-4 grid gap-2">
        {destinations.length ? (
          destinations.map((destination) => (
            <div
              key={destination.id}
              className="rounded-md border border-border bg-canvas p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-body-sm font-black text-ink">
                  {destination.name}
                </p>
                <span className="text-caption font-black uppercase text-muted">
                  {formatEnum(destination.status)}
                </span>
              </div>
              <p className="mt-1 truncate text-caption font-bold text-muted">
                {destination.endpointUrl ?? formatEnum(destination.provider)}
              </p>
            </div>
          ))
        ) : (
          <EmptyCard text="No outbound destinations configured." />
        )}
      </div>
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Cable;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-soft text-teal-strong">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="text-body font-black">{title}</h2>
        <p className="mt-1 text-caption font-bold leading-5 text-muted">{body}</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-caption font-black uppercase text-muted">
      {label}
      {children}
    </label>
  );
}

function Checkbox({
  name,
  value,
  defaultChecked,
  children,
}: {
  name: string;
  value?: string;
  defaultChecked?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-3 text-body-sm font-bold text-ink">
      <input
        name={name}
        value={value}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="size-4 accent-teal"
      />
      {children}
    </label>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-border px-3 py-2 font-black uppercase">
      {children}
    </th>
  );
}

function Td({ children }: { children: ReactNode }) {
  return <td className="border-b border-border px-3 py-3 align-top">{children}</td>;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-body-sm">
      <span className="font-bold text-muted">{label}</span>
      <span className="text-right font-mono font-black text-ink">{value}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-canvas p-4 text-center text-body-sm font-bold leading-6 text-muted">
      {text}
    </div>
  );
}

function jsonText(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return JSON.stringify(value, null, 2);
}

function statusPillClassName(status: string) {
  const base = "rounded-md px-2 py-1 font-black uppercase";
  if (status === "DELIVERED") return `${base} bg-teal-soft text-teal-strong`;
  if (status === "FAILED") return `${base} bg-rose-soft text-rose`;
  if (status === "RETRYING") return `${base} bg-amber-soft text-amber`;
  return `${base} bg-subtle text-muted`;
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function destinationsNoticeMessage(value?: string) {
  const messages: Record<string, string> = {
    "webhook-saved": "Webhook destination saved.",
    "delivery-replayed": "Delivery replay queued.",
  };
  return value ? messages[value] : undefined;
}

const inputClassName =
  "min-h-10 rounded-md border border-border bg-canvas px-3 text-body-sm font-bold text-ink outline-none transition-colors focus:border-teal";

const textareaClassName =
  "resize-y rounded-md border border-border bg-canvas px-3 py-3 text-body-sm font-bold text-ink outline-none transition-colors focus:border-teal";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-caption font-black text-white transition-colors hover:bg-slate disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted";

const secondaryButtonClassName =
  "inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-canvas px-3 py-2 text-caption font-black text-ink transition-colors hover:border-teal/35 disabled:cursor-not-allowed disabled:text-muted";
