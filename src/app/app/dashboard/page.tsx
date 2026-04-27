import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  Clock3,
  Filter,
  Handshake,
  Inbox,
  Languages,
  ListChecks,
  Send,
} from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import {
  getAnalyticsPageData,
  parseAnalyticsChannel,
  parseAnalyticsRange,
} from "@/server/analytics/queries";
import type { AnalyticsReport } from "@/lib/analytics/types";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Northline operational analytics dashboard.",
};

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: Promise<{
    range?: string | string[];
    from?: string | string[];
    to?: string | string[];
    channel?: string | string[];
  }>;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const query = (await searchParams) ?? {};
  const { organization } = await requireCompletedOnboarding();
  const dateRange = parseAnalyticsRange(query);
  const channel = parseAnalyticsChannel(query.channel);
  const { report, channels } = await getAnalyticsPageData({
    organizationId: organization.id,
    dateRange,
    channel,
  });
  const hasData = report.summary.inboundConversations > 0;

  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div>
            <Badge tone="teal">Operational analytics</Badge>
            <h1 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              Where leads are won, delayed, or handed off
            </h1>
            <p className="mt-3 max-w-2xl text-body-sm leading-6 text-muted">
              Track response speed, qualification quality, booking conversion,
              handoff load, language mix, and export delivery from the data
              Northline already stores.
            </p>
          </div>
          <AnalyticsFilters
            dateRange={dateRange}
            channel={channel}
            channels={channels}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Inbox}
          label="Inbound conversations"
          value={String(report.summary.inboundConversations)}
          detail={rangeLabel(dateRange)}
          tone="teal"
        />
        <MetricCard
          icon={Clock3}
          label="First response"
          value={formatDuration(report.summary.averageFirstResponseMs)}
          detail={`${formatPercent(report.summary.firstResponseCoverage)} measured`}
          tone={responseTone(report.summary.averageFirstResponseMs)}
        />
        <MetricCard
          icon={BadgeCheck}
          label="Qualified leads"
          value={String(report.summary.qualifiedLeads)}
          detail="Qualified or sales-ready"
          tone="slate"
        />
        <MetricCard
          icon={CalendarCheck}
          label="Booked appointments"
          value={String(report.summary.bookedAppointments)}
          detail="Confirmed or completed"
          tone="teal"
        />
        <MetricCard
          icon={Handshake}
          label="Handoff rate"
          value={formatPercent(report.summary.handoffRate)}
          detail="Human review required"
          tone={report.summary.handoffRate > 30 ? "amber" : "slate"}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Unanswered / failed"
          value={String(report.summary.unansweredOrFailedCases)}
          detail="Needs attention"
          tone={report.summary.unansweredOrFailedCases > 0 ? "rose" : "teal"}
        />
        <MetricCard
          icon={Send}
          label="Export delivery"
          value={`${report.summary.exportDelivered}/${report.summary.exportDelivered + report.summary.exportFailed}`}
          detail={`${report.summary.exportFailed} failed`}
          tone={report.summary.exportFailed > 0 ? "rose" : "teal"}
        />
        <MetricCard
          icon={ListChecks}
          label="Operator intervention"
          value={formatPercent(report.summary.operatorInterventionRate)}
          detail="Human replies or actions"
          tone="slate"
        />
      </section>

      {!hasData ? <EmptyAnalyticsState /> : null}

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <FunnelPanel report={report} />
        <BreakpointsPanel report={report} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <MixPanel
          icon={BarChart3}
          title="Channel mix"
          empty="No channel data yet."
          items={report.channelMix}
        />
        <MixPanel
          icon={Languages}
          title="Language mix"
          empty="No inbound language data yet."
          items={report.languageMix}
        />
        <ReasonsPanel report={report} />
      </section>

      <RecentActivityPanel report={report} />
    </main>
  );
}

function AnalyticsFilters({
  dateRange,
  channel,
  channels,
}: {
  dateRange: ReturnType<typeof parseAnalyticsRange>;
  channel: string;
  channels: Array<{ id: string; type: string; displayName: string }>;
}) {
  return (
    <form className="rounded-md border border-border bg-canvas p-4">
      <div className="flex items-center gap-2 text-caption font-black uppercase text-muted">
        <Filter aria-hidden="true" className="size-4" />
        Filters
      </div>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-caption font-black uppercase text-muted">
          Date range
          <select
            name="range"
            defaultValue={dateRange.preset}
            className="min-h-10 rounded-md border border-border bg-raised px-3 text-body-sm font-bold normal-case text-ink outline-none focus:border-teal"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="custom">Custom dates</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-caption font-black uppercase text-muted">
            From
            <input
              name="from"
              type="date"
              defaultValue={toDateInput(dateRange.from)}
              className="min-h-10 rounded-md border border-border bg-raised px-3 text-body-sm font-bold normal-case text-ink outline-none focus:border-teal"
            />
          </label>
          <label className="grid gap-1 text-caption font-black uppercase text-muted">
            To
            <input
              name="to"
              type="date"
              defaultValue={toDateInput(dateRange.to)}
              className="min-h-10 rounded-md border border-border bg-raised px-3 text-body-sm font-bold normal-case text-ink outline-none focus:border-teal"
            />
          </label>
        </div>
        <label className="grid gap-1 text-caption font-black uppercase text-muted">
          Channel
          <select
            name="channel"
            defaultValue={channel}
            className="min-h-10 rounded-md border border-border bg-raised px-3 text-body-sm font-bold normal-case text-ink outline-none focus:border-teal"
          >
            <option value="ALL">All channels</option>
            {channels.map((item) => (
              <option key={item.id} value={item.type}>
                {item.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-caption font-black text-white">
        Apply filters
      </button>
    </form>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Inbox;
  label: string;
  value: string;
  detail: string;
  tone: "teal" | "slate" | "amber" | "rose";
}) {
  const tones = {
    teal: "bg-teal-soft text-teal-strong",
    slate: "bg-slate-soft text-slate",
    amber: "bg-amber-soft text-amber-strong",
    rose: "bg-rose-soft text-rose",
  };

  return (
    <article className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <span className={`grid size-10 place-items-center rounded-md ${tones[tone]}`}>
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <p className="mt-4 text-caption font-black uppercase text-muted">{label}</p>
      <p className="mt-2 text-title-sm font-black text-ink">{value}</p>
      <p className="mt-1 text-caption font-bold text-muted">{detail}</p>
    </article>
  );
}

function FunnelPanel({ report }: { report: AnalyticsReport }) {
  const max = Math.max(...report.funnel.map((item) => item.denominator), 1);

  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-black uppercase text-muted">
            Conversion funnel
          </p>
          <h2 className="mt-2 text-title-sm font-black">
            Follow the lead path
          </h2>
        </div>
        <Link
          href="/app/inbox"
          className="inline-flex items-center gap-2 text-caption font-black uppercase text-teal-strong"
        >
          Inbox
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="mt-5 grid gap-4">
        {report.funnel.map((item) => (
          <div key={item.key}>
            <div className="flex items-center justify-between gap-4 text-body-sm">
              <span className="font-bold text-ink">{item.label}</span>
              <span className="font-black text-muted">
                {item.value} / {item.denominator}
              </span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-teal"
                style={{
                  width: `${Math.max(4, Math.min(100, (item.value / max) * 100))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BreakpointsPanel({ report }: { report: AnalyticsReport }) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <p className="text-caption font-black uppercase text-muted">
        Where the funnel breaks
      </p>
      <h2 className="mt-2 text-title-sm font-black">Actionable checkpoints</h2>
      <div className="mt-5 grid gap-3">
        {report.breakpoints.map((item) => (
          <div
            key={item.key}
            className="rounded-md border border-border bg-canvas p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-body-sm font-black text-ink">{item.label}</p>
                <p className="mt-1 text-caption leading-5 text-muted">
                  {item.detail}
                </p>
              </div>
              <span
                className={`rounded-md px-2 py-1 text-caption font-black uppercase ${severityClass(
                  item.severity,
                )}`}
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MixPanel({
  icon: Icon,
  title,
  empty,
  items,
}: {
  icon: typeof BarChart3;
  title: string;
  empty: string;
  items: Array<{ label: string; value: number; percentage: number }>;
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-slate-soft text-slate">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-body font-black">{title}</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between gap-4 text-caption">
                <span className="font-black uppercase text-muted">
                  {item.label}
                </span>
                <span className="font-black text-ink">
                  {item.value} / {formatPercent(item.percentage)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-subtle">
                <div
                  className="h-full rounded-full bg-slate"
                  style={{ width: `${Math.max(4, item.percentage)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-border bg-canvas p-4 text-body-sm leading-6 text-muted">
            {empty}
          </p>
        )}
      </div>
    </section>
  );
}

function ReasonsPanel({ report }: { report: AnalyticsReport }) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-amber-soft text-amber-strong">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-body font-black">Top failure reasons</h2>
      </div>
      <div className="mt-5 grid gap-3">
        {report.topReasons.length ? (
          report.topReasons.map((item) => (
            <div
              key={`${item.source}-${item.reason}`}
              className="rounded-md border border-border bg-canvas p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-body-sm font-bold leading-5 text-ink">
                  {item.reason}
                </p>
                <span className="rounded-md bg-subtle px-2 py-1 text-caption font-black text-muted">
                  {item.count}
                </span>
              </div>
              <p className="mt-2 text-caption font-black uppercase text-muted">
                {item.source}
              </p>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-border bg-canvas p-4 text-body-sm leading-6 text-muted">
            No handoff, delivery, or fallback reasons have been recorded in
            this range.
          </p>
        )}
      </div>
    </section>
  );
}

function RecentActivityPanel({ report }: { report: AnalyticsReport }) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-caption font-black uppercase text-muted">
            Recent activity
          </p>
          <h2 className="mt-2 text-title-sm font-black">
            Latest operational events
          </h2>
        </div>
        <Link
          href="/app/destinations"
          className="inline-flex items-center gap-2 text-caption font-black uppercase text-teal-strong"
        >
          Delivery logs
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <div className="mt-5 overflow-x-auto rounded-md border border-border">
        {report.recentActivity.length ? (
          <table className="w-full border-collapse text-left text-body-sm">
            <thead className="bg-subtle text-caption font-black uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Detail</th>
                <th className="px-4 py-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-canvas">
              {report.recentActivity.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-1 text-caption font-black uppercase ${severityClass(
                        activitySeverity(item.severity),
                      )}`}
                    >
                      {item.type}
                    </span>
                    <p className="mt-2 font-black text-ink">{item.title}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.detail}</td>
                  <td className="px-4 py-3 font-bold text-muted">
                    {formatDate(item.at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="bg-canvas p-5 text-body-sm leading-6 text-muted">
            No operational activity has been recorded in this range.
          </p>
        )}
      </div>
    </section>
  );
}

function EmptyAnalyticsState() {
  return (
    <section className="rounded-lg border border-border bg-teal-soft p-5">
      <p className="text-body font-black text-teal-strong">
        No inbound conversations in this range yet.
      </p>
      <p className="mt-2 max-w-2xl text-body-sm leading-6 text-muted">
        Use the website-chat simulator in the inbox after applying local
        migrations. Northline will start showing response, qualification,
        booking, handoff, and export metrics once real preview events exist.
      </p>
      <Link
        href="/app/inbox"
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-teal px-4 py-2 text-caption font-black text-white"
      >
        Open inbox
      </Link>
    </section>
  );
}

function responseTone(value: number | null) {
  if (value === null) return "slate";
  if (value > 5 * 60_000) return "rose";
  if (value > 60_000) return "amber";
  return "teal";
}

function severityClass(severity: "good" | "watch" | "risk") {
  if (severity === "good") return "bg-teal-soft text-teal-strong";
  if (severity === "risk") return "bg-rose-soft text-rose";
  return "bg-amber-soft text-amber-strong";
}

function activitySeverity(severity: "neutral" | "success" | "warning" | "risk") {
  if (severity === "success") return "good";
  if (severity === "risk") return "risk";
  return "watch";
}

function formatDuration(value: number | null) {
  if (value === null) return "Not measured";
  const seconds = Math.round(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function rangeLabel(value: ReturnType<typeof parseAnalyticsRange>) {
  return `${toDateInput(value.from)} to ${toDateInput(value.to)}`;
}

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}
