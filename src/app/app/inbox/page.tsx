import type { Metadata } from "next";
import {
  AlertTriangle,
  Bot,
  MessageSquarePlus,
  NotebookPen,
  PauseCircle,
  PlayCircle,
  UserCheck,
} from "lucide-react";
import { ChannelBadge } from "@/components/app/inbox/channel-badge";
import { ConversationList } from "@/components/app/inbox/conversation-list";
import { InboxFilters } from "@/components/app/inbox/inbox-filters";
import { MessageTimeline } from "@/components/app/inbox/message-timeline";
import { NoticeBanner } from "@/components/app/notice-banner";
import { Badge } from "@/components/marketing/badge";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import {
  type InboxOperator,
  type InboxConversationDetail,
  getInboxConversationDetail,
  getInboxConversations,
  getInboxOperators,
} from "@/server/inbox/queries";
import {
  addConversationInternalNote,
  assignInboxOperator,
  requestInboxHandoff,
  resumeAiForConversation,
  sendInboxReply,
  simulateWebsiteChatMessage,
  updateConversationStatus,
} from "@/app/app/inbox/actions";

export const metadata: Metadata = {
  title: "Inbox",
  description: "Unified Northline inbox for inbound lead conversations.",
};

export const dynamic = "force-dynamic";

type InboxPageProps = {
  searchParams?: Promise<{
    conversation?: string | string[];
    status?: string | string[];
    q?: string | string[];
    error?: string | string[];
    notice?: string | string[];
  }>;
};

export default async function InboxPage({ searchParams }: InboxPageProps) {
  const query = (await searchParams) ?? {};
  const status = normalizeParam(query.status) ?? "ALL";
  const search = normalizeParam(query.q) ?? "";
  const error = normalizeParam(query.error);
  const notice = inboxNoticeMessage(normalizeParam(query.notice));
  const selectedParam = normalizeParam(query.conversation);
  const { organization } = await requireCompletedOnboarding();
  const conversations = await getInboxConversations({
    organizationId: organization.id,
    status,
    query: search,
  });
  const operators = await getInboxOperators({ organizationId: organization.id });
  const selectedId = selectedParam ?? conversations[0]?.id;
  const selectedConversation = selectedId
    ? await getInboxConversationDetail({
        organizationId: organization.id,
        conversationId: selectedId,
      })
    : null;

  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge tone="teal">Unified inbox</Badge>
            <h1 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              Inbound conversations
            </h1>
            <p className="mt-3 max-w-2xl text-body-sm leading-6 text-muted">
              One operator view for website chat and future messaging channels,
              backed by normalized conversations, messages, contact identities,
              and idempotent channel events.
            </p>
          </div>
          <div className="rounded-md border border-border bg-canvas p-4 text-body-sm">
            <p className="font-black text-ink">{conversations.length}</p>
            <p className="mt-1 text-muted">conversations in this view</p>
          </div>
        </div>
      </section>

      <InboxFilters activeStatus={status} query={search} />

      {error ? <NoticeBanner tone="error">{error}</NoticeBanner> : null}
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <aside className="grid h-fit gap-4">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id}
            status={status}
            query={search}
          />
          <WebsiteChatSimulator />
        </aside>

        <section className="min-h-[620px] rounded-lg border border-border bg-raised shadow-card">
          {selectedConversation ? (
            <ConversationDetail
              conversation={selectedConversation}
              operators={operators}
            />
          ) : (
            <div className="grid min-h-[620px] place-items-center p-8 text-center">
              <div>
                <span className="mx-auto grid size-12 place-items-center rounded-md bg-teal-soft text-teal-strong">
                  <MessageSquarePlus aria-hidden="true" className="size-5" />
                </span>
                <h2 className="mt-5 text-title-sm font-black">
                  No conversation selected
                </h2>
                <p className="mt-3 max-w-md text-body-sm leading-6 text-muted">
                  Use the website-chat simulator to create a local inbound
                  conversation, or select a conversation from the list.
                </p>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function ConversationDetail({
  conversation,
  operators,
}: {
  conversation: InboxConversationDetail;
  operators: InboxOperator[];
}) {
  const leadLabel =
    conversation.lead?.fullName ||
    conversation.lead?.email ||
    conversation.lead?.phone ||
    "Unknown lead";
  const activeHandoff = conversation.handoffs.find((handoff) =>
    ["REQUESTED", "ACCEPTED"].includes(handoff.status),
  );
  const aiPaused =
    conversation.aiResponderState === "PAUSED" || Boolean(activeHandoff);

  return (
    <div className="grid min-h-[620px] grid-rows-[auto_1fr_auto]">
      <header className="border-b border-border p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <ChannelBadge type={conversation.channel?.type} />
              <span className="rounded-md bg-subtle px-2.5 py-1 text-caption font-black uppercase text-muted">
                {conversation.status.replaceAll("_", " ").toLowerCase()}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-caption font-black uppercase ${
                  aiPaused
                    ? "bg-amber-soft text-amber-strong"
                    : "bg-teal-soft text-teal-strong"
                }`}
              >
                {aiPaused ? (
                  <PauseCircle aria-hidden="true" className="size-3.5" />
                ) : (
                  <Bot aria-hidden="true" className="size-3.5" />
                )}
                {aiPaused ? "human active" : "ai active"}
              </span>
              {conversation.assignedUser ? (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-canvas px-2.5 py-1 text-caption font-black uppercase text-muted">
                  <UserCheck aria-hidden="true" className="size-3.5" />
                  {conversation.assignedUser.name ??
                    conversation.assignedUser.email}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 text-title-sm font-black">{leadLabel}</h2>
            <p className="mt-2 text-body-sm text-muted">
              {conversation.lead?.email || "No email"} /{" "}
              {conversation.lead?.phone || "No phone"}
            </p>
          </div>
          <form action={updateConversationStatus} className="flex flex-wrap gap-2">
            <input type="hidden" name="conversationId" value={conversation.id} />
            <StatusButton value="OPEN">Open</StatusButton>
            <StatusButton value="WAITING_ON_LEAD">Waiting</StatusButton>
            <StatusButton value="WAITING_ON_BUSINESS">Handoff</StatusButton>
            <StatusButton value="CLOSED">Close</StatusButton>
          </form>
        </div>
      </header>

      <div className="overflow-hidden p-5">
        <QualificationSnapshot conversation={conversation} />
        <NextActionPanel
          conversation={conversation}
          aiPaused={aiPaused}
          handoffReason={activeHandoff?.reason}
        />
        <OperatorModePanel
          conversation={conversation}
          operators={operators}
          aiPaused={aiPaused}
          activeHandoffReason={activeHandoff?.reason}
        />
        <MessageTimeline conversation={conversation} />
      </div>

      <form action={sendInboxReply} className="border-t border-border p-5">
        <input type="hidden" name="conversationId" value={conversation.id} />
        <label className="grid gap-2 text-body-sm font-bold text-ink">
          {aiPaused ? "Operator reply" : "Reply"}
          <textarea
            name="body"
            rows={4}
            required
            placeholder={
              aiPaused
                ? "AI is paused. Write the human response for this lead..."
                : "Write a clear reply for this lead..."
            }
            className="resize-y rounded-md border border-border bg-canvas px-3 py-3 text-body-sm text-ink outline-none transition-colors focus:border-teal"
          />
        </label>
        <div className="mt-3 flex justify-end">
          <button className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal px-5 py-3 text-body-sm font-black text-white shadow-card transition-colors hover:bg-teal-strong">
            Send reply
          </button>
        </div>
      </form>
    </div>
  );
}

function OperatorModePanel({
  conversation,
  operators,
  aiPaused,
  activeHandoffReason,
}: {
  conversation: InboxConversationDetail;
  operators: InboxOperator[];
  aiPaused: boolean;
  activeHandoffReason?: string;
}) {
  return (
    <section className="mb-5 grid gap-4 rounded-lg border border-border bg-canvas p-4 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-caption font-black uppercase ${
              aiPaused
                ? "bg-amber-soft text-amber-strong"
                : "bg-teal-soft text-teal-strong"
            }`}
          >
            {aiPaused ? (
              <PauseCircle aria-hidden="true" className="size-4" />
            ) : (
              <PlayCircle aria-hidden="true" className="size-4" />
            )}
            {aiPaused ? "AI paused" : "AI ready"}
          </span>
          {activeHandoffReason ? (
            <span className="inline-flex items-center gap-2 rounded-md bg-raised px-2.5 py-1 text-caption font-black uppercase text-muted">
              <AlertTriangle aria-hidden="true" className="size-4" />
              Handoff active
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 text-body-sm leading-6 text-muted">
          <div className="rounded-md border border-border bg-raised p-3">
            <p className="text-caption font-black uppercase text-muted">
              Handoff context
            </p>
            <p className="mt-2 whitespace-pre-wrap text-body-sm leading-6 text-ink">
              {conversation.summary ??
                "No assistant summary yet. The operator can still read the recent thread and add internal notes."}
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-border bg-raised p-3">
              <p className="text-caption font-black uppercase text-muted">
                Current reason
              </p>
              <p className="mt-2 text-body-sm text-ink">
                {activeHandoffReason ??
                  conversation.aiPauseReason ??
                  "No active handoff reason."}
              </p>
            </div>
            <div className="rounded-md border border-border bg-raised p-3">
              <p className="text-caption font-black uppercase text-muted">
                Internal notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-body-sm leading-6 text-ink">
                {conversation.internalNotes ??
                  "No operator notes have been added yet."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <form
          action={aiPaused ? resumeAiForConversation : requestInboxHandoff}
          className="rounded-md border border-border bg-raised p-3"
        >
          <input type="hidden" name="conversationId" value={conversation.id} />
          <label className="grid gap-2 text-caption font-black uppercase text-muted">
            {aiPaused ? "Resume note" : "Handoff reason"}
            <input
              name="reason"
              placeholder={
                aiPaused
                  ? "Why AI can safely resume"
                  : "Why a person should take over"
              }
              className="min-h-10 rounded-md border border-border bg-canvas px-3 text-body-sm font-medium normal-case text-ink outline-none focus:border-teal"
            />
          </label>
          <button
            className={`mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-caption font-black text-white ${
              aiPaused ? "bg-teal hover:bg-teal-strong" : "bg-ink"
            }`}
          >
            {aiPaused ? (
              <PlayCircle aria-hidden="true" className="size-4" />
            ) : (
              <PauseCircle aria-hidden="true" className="size-4" />
            )}
            {aiPaused ? "Resume AI" : "Request handoff"}
          </button>
        </form>

        <form
          action={assignInboxOperator}
          className="rounded-md border border-border bg-raised p-3"
        >
          <input type="hidden" name="conversationId" value={conversation.id} />
          <label className="grid gap-2 text-caption font-black uppercase text-muted">
            Assigned operator
            <select
              name="assignedUserId"
              defaultValue={conversation.assignedUser?.id ?? ""}
              className="min-h-10 rounded-md border border-border bg-canvas px-3 text-body-sm font-medium normal-case text-ink outline-none focus:border-teal"
            >
              <option value="">Unassigned queue</option>
              {operators.map((operator) => (
                <option key={operator.id} value={operator.id}>
                  {operator.name ?? operator.email} ({operator.role.toLowerCase()})
                </option>
              ))}
            </select>
          </label>
          <button className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-canvas px-4 py-2 text-caption font-black text-ink transition-colors hover:border-teal/40">
            <UserCheck aria-hidden="true" className="size-4" />
            Update assignment
          </button>
        </form>

        <form
          action={addConversationInternalNote}
          className="rounded-md border border-border bg-raised p-3"
        >
          <input type="hidden" name="conversationId" value={conversation.id} />
          <label className="grid gap-2 text-caption font-black uppercase text-muted">
            Add internal note
            <textarea
              name="note"
              rows={3}
              required
              placeholder="Add context only operators can see..."
              className="resize-y rounded-md border border-border bg-canvas px-3 py-2 text-body-sm font-medium normal-case text-ink outline-none focus:border-teal"
            />
          </label>
          <button className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-border bg-canvas px-4 py-2 text-caption font-black text-ink transition-colors hover:border-teal/40">
            <NotebookPen aria-hidden="true" className="size-4" />
            Add note
          </button>
        </form>
      </div>
    </section>
  );
}

function QualificationSnapshot({
  conversation,
}: {
  conversation: InboxConversationDetail;
}) {
  if (!conversation.lead && !conversation.summary) return null;

  const lead = conversation.lead;
  const details = [
    lead?.serviceInterest ? ["Interest", lead.serviceInterest] : null,
    lead?.urgency ? ["Timeline", lead.urgency] : null,
    lead?.location ? ["Location", lead.location] : null,
    lead?.budget ? ["Budget", lead.budget] : null,
    lead?.preferredContactMethod
      ? ["Preferred contact", lead.preferredContactMethod]
      : null,
  ].filter(Boolean) as Array<[string, string]>;

  return (
    <section className="mb-5 rounded-lg border border-border bg-canvas p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-caption font-black uppercase text-muted">
            Assistant qualification
          </p>
          <p className="mt-2 text-body-sm leading-6 text-ink">
            {conversation.summary ?? "The assistant has not qualified this lead yet."}
          </p>
        </div>
        {lead ? (
          <div className="rounded-md border border-border bg-raised px-3 py-2 text-caption font-black uppercase text-muted">
            {lead.status.toLowerCase()} / {lead.score} /{" "}
            {lead.qualificationConfidence}% confidence
          </div>
        ) : null}
      </div>
      {details.length > 0 ? (
        <dl className="mt-4 grid gap-2 text-caption sm:grid-cols-2 xl:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label} className="rounded-md bg-raised p-3">
              <dt className="font-black uppercase text-muted">{label}</dt>
              <dd className="mt-1 font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {conversation.internalNotes ? (
        <details className="mt-4">
          <summary className="cursor-pointer text-caption font-black uppercase text-muted">
            Internal notes
          </summary>
          <pre className="mt-2 whitespace-pre-wrap rounded-md bg-raised p-3 text-caption leading-5 text-muted">
            {conversation.internalNotes}
          </pre>
        </details>
      ) : null}
    </section>
  );
}

function NextActionPanel({
  conversation,
  aiPaused,
  handoffReason,
}: {
  conversation: InboxConversationDetail;
  aiPaused: boolean;
  handoffReason?: string;
}) {
  const lead = conversation.lead;
  const nextAction = resolveNextAction({ conversation, aiPaused, handoffReason });

  return (
    <section className="mb-5 grid gap-4 rounded-lg border border-border bg-raised p-4 lg:grid-cols-[1fr_280px]">
      <div>
        <p className="text-caption font-black uppercase text-muted">
          Recommended next action
        </p>
        <h3 className="mt-2 text-body font-black text-ink">
          {nextAction.title}
        </h3>
        <p className="mt-2 text-body-sm leading-6 text-muted">
          {nextAction.body}
        </p>
      </div>
      <div className="grid gap-2 rounded-md border border-border bg-canvas p-3 text-caption">
        <div className="flex items-center justify-between gap-3">
          <span className="font-black uppercase text-muted">Lead status</span>
          <span className="font-mono font-black text-ink">
            {lead?.status.replaceAll("_", " ").toLowerCase() ?? "unknown"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-black uppercase text-muted">AI state</span>
          <span className="font-mono font-black text-ink">
            {aiPaused ? "paused" : "active"}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-black uppercase text-muted">Booking intent</span>
          <span className="font-mono font-black text-ink">
            {lead?.bookingIntent ? "yes" : "not yet"}
          </span>
        </div>
      </div>
    </section>
  );
}

function resolveNextAction({
  conversation,
  aiPaused,
  handoffReason,
}: {
  conversation: InboxConversationDetail;
  aiPaused: boolean;
  handoffReason?: string;
}) {
  const lead = conversation.lead;
  if (handoffReason || aiPaused) {
    return {
      title: "Operator should reply with handoff context.",
      body:
        handoffReason ??
        conversation.aiPauseReason ??
        "AI is paused. Review the summary and send a human response before resuming automation.",
    };
  }

  if (lead?.bookingIntent || lead?.status === "SALES_READY") {
    return {
      title: "Offer booking times.",
      body:
        "The lead has enough context for a booking path. Northline can suggest local mock slots or the operator can reply manually.",
    };
  }

  if (conversation.status === "WAITING_ON_LEAD") {
    return {
      title: "Wait for the visitor to answer.",
      body:
        "The assistant has asked for the next missing detail. Keep the thread open and review the next inbound response.",
    };
  }

  if (!lead) {
    return {
      title: "Capture the first visitor message.",
      body:
        "Use the website-chat simulator or signed API endpoint to create a lead-backed conversation.",
    };
  }

  return {
    title: "Continue qualification.",
    body:
      "Collect the missing contact, service, urgency, or language details until the lead can be booked or handed off.",
  };
}

function StatusButton({
  value,
  children,
}: {
  value: string;
  children: string;
}) {
  return (
    <button
      name="status"
      value={value}
      className="rounded-md border border-border bg-canvas px-3 py-2 text-caption font-black text-muted transition-colors hover:border-teal/35 hover:text-ink"
    >
      {children}
    </button>
  );
}

function WebsiteChatSimulator() {
  return (
    <form
      action={simulateWebsiteChatMessage}
      className="rounded-lg border border-border bg-raised p-5 shadow-card"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-md bg-teal-soft text-teal-strong">
          <Bot aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-body font-black">Website chat simulator</h2>
          <p className="text-caption font-bold text-muted">
            Local preview channel
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <input
          name="name"
          placeholder="Lead name"
          className="min-h-10 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none focus:border-teal"
        />
        <input
          name="email"
          type="email"
          placeholder="lead@example.com"
          className="min-h-10 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none focus:border-teal"
        />
        <input
          name="phone"
          placeholder="+30 phone number"
          className="min-h-10 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none focus:border-teal"
        />
        <input
          name="threadId"
          defaultValue="preview-website-thread"
          aria-label="Thread id"
          className="min-h-10 rounded-md border border-border bg-canvas px-3 font-mono text-caption text-ink outline-none focus:border-teal"
        />
        <input
          type="hidden"
          name="visitorId"
          value="preview-website-visitor"
        />
        <textarea
          name="message"
          rows={4}
          required
          placeholder="Hi, I want to book a consultation next week."
          className="resize-y rounded-md border border-border bg-canvas px-3 py-3 text-body-sm text-ink outline-none focus:border-teal"
        />
      </div>
      <button className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-caption font-black text-white">
        Add inbound message
      </button>
    </form>
  );
}

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function inboxNoticeMessage(value?: string) {
  const messages: Record<string, string> = {
    "message-added":
      "Preview inbound message added. The assistant processed it and the thread is ready for review.",
    "reply-sent": "Operator reply sent and the conversation was updated.",
    "status-updated": "Conversation status updated.",
    "handoff-requested": "Human handoff requested and AI is paused.",
    "ai-resumed": "AI responses resumed for this conversation.",
    "assignment-updated": "Conversation assignment updated.",
    "note-added": "Internal note added for operators.",
  };
  return value ? messages[value] : undefined;
}
