import Link from "next/link";
import { ChannelBadge } from "@/components/app/inbox/channel-badge";
import type { InboxConversationListItem } from "@/server/inbox/queries";

type ConversationListProps = {
  conversations: InboxConversationListItem[];
  selectedId?: string;
  status: string;
  query: string;
};

export function ConversationList({
  conversations,
  selectedId,
  status,
  query,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-raised p-6 text-body-sm leading-6 text-muted shadow-card">
        No conversations match this view. Try clearing the search or send a
        local website-chat message from the simulator.
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {conversations.map((conversation) => (
        <Link
          key={conversation.id}
          href={buildConversationHref({
            conversationId: conversation.id,
            status,
            query,
          })}
          className={`rounded-lg border p-4 transition-colors ${
            selectedId === conversation.id
              ? "border-teal/45 bg-teal-soft"
              : "border-border bg-raised hover:border-teal/35"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-body-sm font-black text-ink">
                {conversation.lead?.fullName ||
                  conversation.lead?.email ||
                  conversation.lead?.phone ||
                  "Unknown lead"}
              </p>
              <p className="mt-1 line-clamp-2 text-caption leading-5 text-muted">
                {conversation.lastMessagePreview || "No message preview yet."}
              </p>
            </div>
            <ChannelBadge type={conversation.channel?.type} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-caption font-bold text-muted">
            <span>{formatStatus(conversation.status)}</span>
            <span>/</span>
            <span>
              {conversation.aiResponderState === "PAUSED" ||
              conversation.activeHandoffStatus
                ? "human active"
                : "ai active"}
            </span>
            <span>/</span>
            <span>{conversation.messageCount} messages</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function buildConversationHref(input: {
  conversationId: string;
  status: string;
  query: string;
}) {
  const params = new URLSearchParams();
  params.set("conversation", input.conversationId);
  if (input.status && input.status !== "ALL") params.set("status", input.status);
  if (input.query) params.set("q", input.query);
  return `/app/inbox?${params.toString()}`;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}
