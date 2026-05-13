import {
  CalendarCheck,
  CheckCircle2,
  DatabaseZap,
  Languages,
  MessageCircle,
  MessagesSquare,
  Route,
  Send,
  UserCheck,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { cn } from "@/lib/utils";

const inboxLeads = [
  {
    name: "Maria K.",
    channel: "Website chat",
    summary: "Asked for pricing and wants a consultation this week.",
    status: "Qualifying now",
    tone: "teal",
  },
  {
    name: "Nikos P.",
    channel: "WhatsApp",
    summary: "Needs availability for tomorrow afternoon.",
    status: "New lead",
    tone: "blue",
  },
  {
    name: "Eleni D.",
    channel: "Instagram",
    summary: "Asked in Greek about service area and booking.",
    status: "Waiting",
    tone: "amber",
  },
] as const;

const chatMessages = [
  {
    sender: "Visitor",
    body: "Hi, can I get a consultation this week?",
  },
  {
    sender: "Northline",
    body: "Yes. What service are you interested in and which day works best?",
  },
  {
    sender: "Visitor",
    body: "Pricing first, then maybe Thursday. Μπορώ και ελληνικά.",
  },
  {
    sender: "Northline",
    body: "Got it. I can collect the basics and suggest booking times.",
  },
] as const;

const qualificationItems = [
  { label: "Need", value: "Pricing + consultation" },
  { label: "Timing", value: "This week" },
  { label: "Language", value: "Greek + English" },
  { label: "Consent", value: "Confirmed" },
  { label: "Booking readiness", value: "Ready to book" },
] as const;

const destinations = [
  { label: "Calendar", detail: "Booking link suggested", icon: CalendarCheck },
  { label: "CRM/Webhook", detail: "Payload ready", icon: Webhook },
  { label: "Human handoff", detail: "Owner notified", icon: UserCheck },
] as const;

export function LeadWorkflowDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="grid gap-4">
        <InboxPanel />
        <DestinationsPanel />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_0.88fr]">
        <WebsiteChatPreview />
        <div className="grid gap-4">
          <QualificationPanel />
          <HandoffPacket />
        </div>
      </div>
    </div>
  );
}

function InboxPanel() {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-raised shadow-card">
      <PanelHeader
        icon={MessagesSquare}
        eyebrow="Capture"
        title="One lead queue"
        meta="3 active"
      />
      <div className="divide-y divide-border">
        {inboxLeads.map((lead, index) => (
          <div
            key={lead.name}
            className={cn("p-4", index === 0 ? "bg-teal-soft/45" : "bg-canvas")}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-body-sm font-black">{lead.name}</h3>
                <p className="mt-1 text-caption text-muted">{lead.channel}</p>
              </div>
              <Badge tone={lead.tone}>{lead.status}</Badge>
            </div>
            <p className="mt-3 text-caption leading-5 text-muted">
              {lead.summary}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function WebsiteChatPreview() {
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-raised shadow-card">
      <PanelHeader
        icon={MessageCircle}
        eyebrow="Reply"
        title="Website chat"
        meta="Greek + English"
      />
      <div className="grid gap-3 bg-canvas p-4">
        {chatMessages.map((message) => {
          const isAssistant = message.sender === "Northline";

          return (
            <div
              key={message.body}
              className={cn(
                "max-w-[88%] rounded-md border p-3 text-caption leading-5",
                isAssistant
                  ? "ml-auto border-teal/20 bg-teal-soft text-teal-strong"
                  : "border-border bg-raised text-muted",
              )}
            >
              <p className="mb-1 font-black text-ink">{message.sender}</p>
              <p>{message.body}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function QualificationPanel() {
  return (
    <article className="rounded-lg border border-border bg-raised p-4 shadow-card">
      <PanelTitle icon={CheckCircle2} eyebrow="Qualify" title="Lead fields" />
      <div className="mt-4 grid gap-2">
        {qualificationItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 rounded-md border border-border bg-canvas p-3"
          >
            <div>
              <p className="text-caption font-black uppercase text-muted">
                {item.label}
              </p>
              <p className="mt-1 text-caption font-black text-ink">
                {item.value}
              </p>
            </div>
            <CheckCircle2 aria-hidden="true" className="size-4 text-teal" />
          </div>
        ))}
      </div>
    </article>
  );
}

export function HandoffPacket() {
  return (
    <article className="rounded-lg border border-border bg-ink p-4 text-canvas shadow-card">
      <PanelTitle
        icon={Route}
        eyebrow="Book or hand off"
        title="Handoff packet"
        inverted
      />
      <ul className="mt-4 grid gap-2 text-caption leading-5 text-canvas/78">
        <li>Asked for pricing and Thursday availability.</li>
        <li>Prefers Greek or English follow-up.</li>
        <li>Suggested next step: offer booking times.</li>
      </ul>
      <div className="mt-4 rounded-md border border-white/15 bg-white/10 p-3">
        <p className="text-caption font-black uppercase text-teal-soft">
          Missing detail
        </p>
        <p className="mt-1 text-caption leading-5 text-canvas/78">
          Confirm preferred contact method before handoff.
        </p>
      </div>
    </article>
  );
}

export function DestinationsPanel() {
  return (
    <article className="rounded-lg border border-border bg-raised p-4 shadow-card">
      <PanelTitle icon={Send} eyebrow="Sync" title="Destinations" />
      <div className="mt-4 grid gap-3">
        {destinations.map((destination) => {
          const Icon = destination.icon;

          return (
            <div
              key={destination.label}
              className="flex items-center gap-3 rounded-md border border-border bg-canvas p-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-soft text-blue">
                <Icon aria-hidden="true" className="size-4" />
              </span>
              <div>
                <p className="text-body-sm font-black">{destination.label}</p>
                <p className="mt-1 text-caption text-muted">
                  {destination.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function PanelHeader({
  icon: Icon,
  eyebrow,
  title,
  meta,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border p-4">
      <PanelTitle icon={Icon} eyebrow={eyebrow} title={title} />
      <span className="rounded-sm bg-canvas px-2 py-1 font-mono text-caption font-black text-muted">
        {meta}
      </span>
    </div>
  );
}

function PanelTitle({
  icon: Icon,
  eyebrow,
  title,
  inverted = false,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  inverted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-md",
          inverted ? "bg-white/10 text-teal-soft" : "bg-teal-soft text-teal-strong",
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div>
        <p
          className={cn(
            "text-caption font-black uppercase",
            inverted ? "text-canvas/60" : "text-muted",
          )}
        >
          {eyebrow}
        </p>
        <h3 className="mt-1 text-body-sm font-black">{title}</h3>
      </div>
    </div>
  );
}

export function TrustStrip() {
  const items = [
    {
      title: "Preview rebuild",
      body: "Separate from the live northline.ai production project.",
      icon: DatabaseZap,
    },
    {
      title: "Greek and English",
      body: "First-class lead handling in both launch languages.",
      icon: Languages,
    },
    {
      title: "Human handoff",
      body: "The AI prepares context. Your team keeps control.",
      icon: UserCheck,
    },
    {
      title: "Server-side workflow",
      body: "Postgres-backed records and signed webhook paths.",
      icon: CheckCircle2,
    },
  ] as const;

  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article key={item.title} className="bg-raised p-5">
            <span className="grid size-9 place-items-center rounded-md bg-teal-soft text-teal-strong">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <h3 className="mt-4 text-body-sm font-black">{item.title}</h3>
            <p className="mt-2 text-caption leading-5 text-muted">{item.body}</p>
          </article>
        );
      })}
    </div>
  );
}
