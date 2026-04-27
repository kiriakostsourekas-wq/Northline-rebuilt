import type {
  BusinessContextSectionValue,
  KnowledgeItemInput,
} from "@/lib/knowledge/types";

type StarterKnowledgeExample = {
  section: BusinessContextSectionValue;
  title: string;
  fields: Record<string, string>;
};

export const starterKnowledgeExamples: StarterKnowledgeExample[] = [
  {
    section: "BUSINESS_PROFILE",
    title: "Business overview",
    fields: {
      description:
        "We help customers understand the available services, qualify their needs, and book the right next step with the team.",
      idealCustomers: "People who have a clear need, timeline, and contact details.",
      tone: "Helpful, practical, concise, and honest about what needs human review.",
    },
  },
  {
    section: "SERVICES",
    title: "Discovery consultation",
    fields: {
      name: "Discovery consultation",
      summary:
        "A short call to understand the lead's need, timeline, location, and next best action.",
      availability: "Available in Greek and English.",
    },
  },
  {
    section: "FAQ",
    title: "How fast can we start?",
    fields: {
      question: "How fast can we start?",
      answer:
        "The team can usually review qualified inquiries within one business day. Exact timing depends on availability and scope.",
    },
  },
  {
    section: "QUALIFICATION_RULES",
    title: "Minimum lead details",
    fields: {
      rule:
        "Before handoff, collect name, contact details, service interest, location, and preferred timing.",
      priority: "High",
      disqualifiers: "No contact details, spam, or requests outside the service area.",
    },
  },
  {
    section: "BOOKING_RULES",
    title: "Booking readiness",
    fields: {
      bookingPath:
        "Offer booking only after the lead has shared what they need and a valid email or phone number.",
      duration: "30 minutes",
      constraints: "If the request is urgent or unclear, route to a human before booking.",
    },
  },
  {
    section: "ESCALATION_RULES",
    title: "Human handoff triggers",
    fields: {
      trigger:
        "Escalate complaints, legal questions, custom pricing requests, unsafe content, and anything the assistant cannot answer from approved knowledge.",
      destination: "Owner or sales inbox",
      urgency: "Same business day unless the lead is upset or urgent.",
    },
  },
];

export function buildStarterInputs(locale: "EN" | "EL" | null) {
  return starterKnowledgeExamples.map(
    (example): KnowledgeItemInput => ({
      section: example.section,
      title: example.title,
      fields: example.fields,
      locale: locale ?? "EN",
      status: "DRAFT",
    }),
  );
}
