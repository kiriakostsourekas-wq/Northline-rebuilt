import type { InboxConversationDetail } from "@/server/inbox/queries";

type MessageTimelineProps = {
  conversation: InboxConversationDetail;
};

export function MessageTimeline({ conversation }: MessageTimelineProps) {
  const items = [
    ...conversation.messages.map((message) => ({
      id: `message-${message.id}`,
      type: "message" as const,
      at: message.createdAt,
      message,
    })),
    ...conversation.handoffEvents.map((event) => ({
      id: `handoff-${event.id}`,
      type: "handoff" as const,
      at: event.createdAt,
      event,
    })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-canvas p-4 text-body-sm text-muted">
        Messages will appear here once an inbound event is processed.
      </div>
    );
  }

  return (
    <ol className="grid gap-3">
      {items.map((item) => {
        if (item.type === "handoff") {
          return (
            <li key={item.id} className="flex justify-center">
              <div className="max-w-[88%] rounded-md border border-amber/40 bg-amber-soft px-3 py-2 text-caption leading-5 text-amber-strong">
                <div className="font-black uppercase">
                  {handoffEventLabel(item.event.eventType)}
                  {item.event.actorUser ? (
                    <span className="font-bold normal-case">
                      {" "}
                      by {item.event.actorUser.name ?? item.event.actorUser.email}
                    </span>
                  ) : null}
                  <span className="font-bold normal-case">
                    {" "}
                    / {formatDate(item.event.createdAt)}
                  </span>
                </div>
                {item.event.reason || item.event.note ? (
                  <p className="mt-1 text-caption font-bold normal-case">
                    {item.event.note ?? item.event.reason}
                  </p>
                ) : null}
              </div>
            </li>
          );
        }

        const message = item.message;
        const isInbound = message.direction === "INBOUND";
        const bubbleClass = messageBubbleClass({
          isInbound,
          senderType: message.senderType,
        });

        return (
          <li
            key={message.id}
            className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[82%] rounded-lg border p-4 ${bubbleClass}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-caption font-black uppercase opacity-75">
                <span>{messageLabel(message.senderType, isInbound)}</span>
                <span>/</span>
                <span>{languageLabel(message.detectedLanguage)}</span>
                <span>/</span>
                <time dateTime={message.createdAt.toISOString()}>
                  {formatDate(message.createdAt)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-body-sm leading-6">
                {message.displayBody ?? message.body}
              </p>
              {message.errorMessage ? (
                <p className="mt-2 text-caption font-bold text-rose">
                  {message.errorMessage}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function messageBubbleClass(input: { isInbound: boolean; senderType: string }) {
  if (input.isInbound) return "border-border bg-canvas text-ink";
  if (input.senderType === "ASSISTANT") {
    return "border-teal/35 bg-teal text-white";
  }
  if (input.senderType === "HUMAN") {
    return "border-ink/20 bg-ink text-white";
  }
  return "border-border bg-subtle text-ink";
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function messageLabel(senderType: string, isInbound: boolean) {
  if (isInbound) return "Lead";
  if (senderType === "ASSISTANT") return "Assistant";
  if (senderType === "SYSTEM") return "System";
  return "Operator";
}

function languageLabel(language: string) {
  return language.toLowerCase().replaceAll("_", " ");
}

function handoffEventLabel(eventType: string) {
  return eventType.replaceAll("_", " ").toLowerCase();
}
