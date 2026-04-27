type HandoffLead = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  preferredContactMethod?: string | null;
  serviceInterest?: string | null;
  budget?: string | null;
  location?: string | null;
  urgency?: string | null;
  status?: string | null;
  score?: number | null;
  summary?: string | null;
};

type HandoffMessage = {
  direction: string;
  senderType: string;
  body: string;
  displayBody?: string | null;
  rawBody?: string | null;
  createdAt?: Date | null;
};

export function buildHandoffSummary(input: {
  reason: string;
  lead?: HandoffLead | null;
  existingSummary?: string | null;
  messages?: HandoffMessage[];
}) {
  const lead = input.lead;
  const timeline = [...(input.messages ?? [])].sort(
    (a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0),
  );
  const latestInbound = timeline
    .reverse()
    .find((message) => message.direction === "INBOUND");
  const knownDetails = [
    lead?.fullName ? `Name: ${lead.fullName}` : null,
    lead?.email ? `Email: ${lead.email}` : null,
    lead?.phone ? `Phone: ${lead.phone}` : null,
    lead?.preferredContactMethod
      ? `Preferred contact: ${lead.preferredContactMethod}`
      : null,
    lead?.serviceInterest ? `Interest: ${lead.serviceInterest}` : null,
    lead?.budget ? `Budget: ${lead.budget}` : null,
    lead?.location ? `Location: ${lead.location}` : null,
    lead?.urgency ? `Timeline: ${lead.urgency}` : null,
  ].filter(Boolean);
  const missing = [
    lead?.fullName ? null : "name",
    lead?.email || lead?.phone || lead?.preferredContactMethod
      ? null
      : "contact method",
    lead?.serviceInterest ? null : "service or product interest",
    lead?.urgency ? null : "timeline",
  ].filter(Boolean);
  const context = input.existingSummary?.trim() || lead?.summary?.trim();
  const latest = messageText(latestInbound);

  return [
    "Handoff summary",
    `Reason: ${input.reason}`,
    context ? `Assistant context: ${context}` : null,
    knownDetails.length ? `Known details: ${knownDetails.join("; ")}` : null,
    missing.length ? `Missing details: ${missing.join(", ")}` : null,
    latest ? `Latest customer message: ${truncate(latest, 240)}` : null,
    lead?.status || typeof lead?.score === "number"
      ? `Lead state: ${lead?.status ?? "unknown"} / score ${lead?.score ?? 0}`
      : null,
    "Recommended next step: Operator should review the approved business context and reply directly.",
  ]
    .filter(Boolean)
    .join("\n");
}

function messageText(message?: HandoffMessage) {
  return message?.displayBody ?? message?.rawBody ?? message?.body ?? "";
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}
