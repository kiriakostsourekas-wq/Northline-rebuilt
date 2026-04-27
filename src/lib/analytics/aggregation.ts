import type {
  AnalyticsAggregationInput,
  AnalyticsConversationRecord,
  AnalyticsReport,
} from "@/lib/analytics/types";

const qualifiedLeadStatuses = new Set(["QUALIFIED", "SALES_READY"]);
const bookedStatuses = new Set(["CONFIRMED", "COMPLETED"]);
const exportDeliveredStatuses = new Set(["DELIVERED"]);
const exportFailedStatuses = new Set(["FAILED", "PARTIAL"]);

export function buildOperationalAnalytics(
  input: AnalyticsAggregationInput,
): AnalyticsReport {
  const conversations = input.conversations.filter(hasInboundMessage);
  const inboundCount = conversations.length;
  const firstResponseTimes = conversations
    .map(firstResponseTimeMs)
    .filter((value): value is number => typeof value === "number");
  const averageFirstResponseMs = average(firstResponseTimes);
  const qualifiedConversationCount = conversations.filter((conversation) =>
    qualifiedLeadStatuses.has(conversation.leadStatus ?? ""),
  ).length;
  const qualifiedLeadIds = new Set(
    conversations
      .filter((conversation) =>
        qualifiedLeadStatuses.has(conversation.leadStatus ?? ""),
      )
      .map((conversation) => conversation.leadId)
      .filter(Boolean),
  );
  const bookedAppointments = input.bookings.filter((booking) =>
    bookedStatuses.has(booking.status),
  ).length;
  const handoffConversations = conversations.filter(hasHumanHandoff);
  const operatorInterventions = conversations.filter(hasOperatorIntervention);
  const unanswered = conversations.filter(isUnanswered).length;
  const failedOutbound = conversations.filter(hasFailedOutbound).length;
  const exportDelivered = input.exports.filter((item) =>
    exportDeliveredStatuses.has(item.status),
  ).length;
  const exportFailed = input.exports.filter((item) =>
    exportFailedStatuses.has(item.status),
  ).length;
  const failedDeliveryAttempts = input.deliveryAttempts.filter((attempt) =>
    exportFailedStatuses.has(attempt.status),
  ).length;
  const denominator = Math.max(inboundCount, 1);

  return {
    dateRange: input.dateRange,
    summary: {
      inboundConversations: inboundCount,
      averageFirstResponseMs,
      firstResponseCoverage: rate(firstResponseTimes.length, denominator),
      qualifiedLeads:
        qualifiedLeadIds.size > 0 ? qualifiedLeadIds.size : qualifiedConversationCount,
      bookedAppointments,
      handoffRate: rate(handoffConversations.length, denominator),
      unansweredOrFailedCases: unanswered + failedOutbound + exportFailed,
      operatorInterventionRate: rate(operatorInterventions.length, denominator),
      exportDelivered,
      exportFailed,
    },
    funnel: [
      {
        key: "inbound",
        label: "Inbound conversations",
        value: inboundCount,
        denominator,
      },
      {
        key: "qualified",
        label: "Qualified leads",
        value:
          qualifiedLeadIds.size > 0
            ? qualifiedLeadIds.size
            : qualifiedConversationCount,
        denominator,
      },
      {
        key: "booked",
        label: "Booked appointments",
        value: bookedAppointments,
        denominator,
      },
      {
        key: "exported",
        label: "Delivered exports",
        value: exportDelivered,
        denominator: Math.max(input.exports.length, 1),
      },
    ],
    channelMix: mix(
      conversations.map(
        (conversation) =>
          conversation.channelDisplayName ??
          formatLabel(conversation.channelType ?? "Unknown channel"),
      ),
    ),
    languageMix: mix(
      conversations.flatMap((conversation) =>
        conversation.messages
          .filter((message) => message.direction === "INBOUND")
          .map((message) => formatLabel(message.detectedLanguage)),
      ),
    ),
    breakpoints: [
      breakpoint({
        key: "response_speed",
        label: "Response speed",
        value: slowResponses(firstResponseTimes).length,
        detail:
          averageFirstResponseMs === null
            ? "No measured first responses yet."
            : `Average first response is ${formatDuration(averageFirstResponseMs)}.`,
        severity:
          averageFirstResponseMs === null
            ? "watch"
            : averageFirstResponseMs <= 60_000
              ? "good"
              : averageFirstResponseMs <= 5 * 60_000
                ? "watch"
                : "risk",
      }),
      breakpoint({
        key: "qualification",
        label: "Qualification quality",
        value: Math.max(inboundCount - qualifiedConversationCount, 0),
        detail: `${qualifiedConversationCount} of ${inboundCount} conversations reached a qualified lead state.`,
        severity: rate(qualifiedConversationCount, denominator) >= 0.5 ? "good" : "watch",
      }),
      breakpoint({
        key: "booking_dropoff",
        label: "Booking drop-off",
        value: Math.max(qualifiedConversationCount - bookedAppointments, 0),
        detail: `${bookedAppointments} confirmed or completed appointments from qualified leads.`,
        severity:
          qualifiedConversationCount === 0 ||
          bookedAppointments / Math.max(qualifiedConversationCount, 1) >= 0.3
            ? "good"
            : "watch",
      }),
      breakpoint({
        key: "handoff",
        label: "Human handoff",
        value: handoffConversations.length,
        detail: `${handoffConversations.length} conversations needed human review.`,
        severity: handoffConversations.length / denominator <= 0.25 ? "good" : "watch",
      }),
      breakpoint({
        key: "delivery",
        label: "Export delivery",
        value: exportFailed + failedDeliveryAttempts,
        detail: `${exportDelivered} exports delivered, ${exportFailed + failedDeliveryAttempts} export failures or failed attempts.`,
        severity: exportFailed + failedDeliveryAttempts > 0 ? "risk" : "good",
      }),
    ],
    topReasons: topReasons({
      conversations,
      exportErrors: [
        ...input.exports.map((item) => item.lastError),
        ...input.deliveryAttempts.map((attempt) => attempt.errorMessage),
      ],
    }),
    recentActivity: recentActivity(input).slice(0, 10),
  };
}

function hasInboundMessage(conversation: AnalyticsConversationRecord) {
  return conversation.messages.some((message) => message.direction === "INBOUND");
}

function firstResponseTimeMs(conversation: AnalyticsConversationRecord) {
  const firstInbound = [...conversation.messages]
    .sort(byCreatedAt)
    .find((message) => message.direction === "INBOUND");
  if (!firstInbound) return null;

  const firstOutbound = [...conversation.messages]
    .sort(byCreatedAt)
    .find(
      (message) =>
        message.direction === "OUTBOUND" &&
        message.senderType !== "SYSTEM" &&
        message.createdAt.getTime() >= firstInbound.createdAt.getTime(),
    );

  if (!firstOutbound) return null;
  return Math.max(
    0,
    (firstOutbound.sentAt ?? firstOutbound.createdAt).getTime() -
      firstInbound.createdAt.getTime(),
  );
}

function hasHumanHandoff(conversation: AnalyticsConversationRecord) {
  return (
    conversation.handoffs.length > 0 ||
    conversation.handoffEvents.some((event) =>
      ["REQUESTED", "ACCEPTED", "AI_PAUSED"].includes(event.eventType),
    )
  );
}

function hasOperatorIntervention(conversation: AnalyticsConversationRecord) {
  return (
    conversation.messages.some(
      (message) =>
        message.direction === "OUTBOUND" && message.senderType === "HUMAN",
    ) ||
    conversation.handoffEvents.some((event) => Boolean(event.actorUserId))
  );
}

function isUnanswered(conversation: AnalyticsConversationRecord) {
  const latestInbound = [...conversation.messages]
    .sort(byCreatedAt)
    .reverse()
    .find((message) => message.direction === "INBOUND");
  if (!latestInbound) return false;

  return !conversation.messages.some(
    (message) =>
      message.direction === "OUTBOUND" &&
      message.senderType !== "SYSTEM" &&
      message.createdAt.getTime() > latestInbound.createdAt.getTime(),
  );
}

function hasFailedOutbound(conversation: AnalyticsConversationRecord) {
  return conversation.messages.some(
    (message) =>
      message.direction === "OUTBOUND" &&
      (message.failedAt || message.errorMessage),
  );
}

function mix(labels: string[]) {
  const total = Math.max(labels.length, 1);
  const counts = labels.reduce((acc, label) => {
    acc.set(label, (acc.get(label) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());

  return Array.from(counts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: rate(value, total),
    }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function breakpoint(input: AnalyticsReport["breakpoints"][number]) {
  return input;
}

function topReasons(input: {
  conversations: AnalyticsConversationRecord[];
  exportErrors: Array<string | null | undefined>;
}) {
  const reasons = new Map<string, { count: number; source: string }>();
  const add = (reason: string | null | undefined, source: string) => {
    const cleaned = reason?.trim();
    if (!cleaned) return;
    const existing = reasons.get(cleaned) ?? { count: 0, source };
    existing.count += 1;
    reasons.set(cleaned, existing);
  };

  for (const conversation of input.conversations) {
    for (const handoff of conversation.handoffs) add(handoff.reason, "Handoff");
    for (const message of conversation.messages) {
      add(message.errorMessage, "Message delivery");
    }
  }
  for (const error of input.exportErrors) add(error, "Export");

  return Array.from(reasons.entries())
    .map(([reason, value]) => ({
      reason,
      count: value.count,
      source: value.source,
    }))
    .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason))
    .slice(0, 6);
}

function recentActivity(input: AnalyticsAggregationInput) {
  return [
    ...input.conversations.map((conversation) => ({
      id: `conversation-${conversation.id}`,
      type: "Conversation",
      title: "Inbound conversation",
      detail: `${formatLabel(conversation.channelType ?? "Unknown channel")} / ${formatLabel(conversation.status)}`,
      at: conversation.lastInboundAt ?? conversation.createdAt,
      severity: "neutral" as const,
    })),
    ...input.conversations.flatMap((conversation) =>
      conversation.handoffEvents.map((event) => ({
        id: `handoff-${event.id}`,
        type: "Handoff",
        title: formatLabel(event.eventType),
        detail: event.reason ?? event.note ?? "Operator event recorded.",
        at: event.createdAt,
        severity:
          event.eventType === "AI_RESUMED"
            ? ("success" as const)
            : ("warning" as const),
      })),
    ),
    ...input.bookings.map((booking) => ({
      id: `booking-${booking.id}`,
      type: "Booking",
      title: formatLabel(booking.status),
      detail: "Appointment workflow updated.",
      at: booking.confirmedAt ?? booking.createdAt,
      severity: bookedStatuses.has(booking.status)
        ? ("success" as const)
        : ("neutral" as const),
    })),
    ...input.exports.map((item) => ({
      id: `export-${item.id}`,
      type: "Export",
      title: `${formatLabel(item.eventType)} export`,
      detail: item.lastError ?? formatLabel(item.status),
      at: item.deliveredAt ?? item.createdAt,
      severity: exportFailedStatuses.has(item.status)
        ? ("risk" as const)
        : exportDeliveredStatuses.has(item.status)
          ? ("success" as const)
          : ("neutral" as const),
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());
}

function slowResponses(values: number[]) {
  return values.filter((value) => value > 5 * 60_000);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function rate(value: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((value / denominator) * 1000) / 10;
}

function byCreatedAt(
  a: { createdAt: Date },
  b: { createdAt: Date },
) {
  return a.createdAt.getTime() - b.createdAt.getTime();
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function formatDuration(ms: number) {
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.round(minutes / 60)}h`;
}
