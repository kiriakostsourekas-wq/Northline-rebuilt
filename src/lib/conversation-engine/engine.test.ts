import { describe, expect, it } from "vitest";
import { runConversationEngine } from "@/lib/conversation-engine/engine";
import { extractLeadFields } from "@/lib/conversation-engine/extraction";
import { defaultQualificationPlaybook } from "@/lib/conversation-engine/playbook";
import type { ConversationEngineInput } from "@/lib/conversation-engine/types";
import { assembleBusinessContextBundle } from "@/lib/knowledge/context";
import type {
  BusinessContextRecord,
  BusinessContextSectionValue,
} from "@/lib/knowledge/types";

describe("conversation engine", () => {
  it("extracts core lead fields from a realistic inbound message", () => {
    const fields = extractLeadFields({
      message:
        "My name is Maria K. I need AI sales assistant setup in Athens this week. Email maria@example.com or call +30 690 123 4567. Budget around 1200 EUR.",
      businessContext: makeContext(),
    });

    expect(fields).toMatchObject({
      name: "Maria K",
      email: "maria@example.com",
      phone: "+306901234567",
      serviceInterest: "AI sales assistant setup",
      location: "Athens",
      urgency: "this week",
      budget: "1200 EUR",
    });
  });

  it("escalates pricing questions when pricing notes are not published", () => {
    const decision = runConversationEngine(
      makeInput({
        latestMessage:
          "How much does this cost? I need AI sales assistant setup for our Athens office.",
        context: makeContext({ includePricing: false }),
      }),
    );

    expect(decision.intent).toBe("PRICING_QUESTION");
    expect(decision.shouldEscalate).toBe(true);
    expect(decision.nextConversationStatus).toBe("WAITING_ON_BUSINESS");
    expect(decision.reply).toContain("I do not want to guess");
    expect(decision.missingFields).toContain("budget");
    expect(decision.internalNotes).toContain("CRM export notes");
  });

  it("marks complete booking requests as booking-ready without extra questions", () => {
    const decision = runConversationEngine(
      makeInput({
        latestMessage:
          "I am Nikos Demo. Please book a demo for AI sales assistant setup next week. Email nikos@example.com.",
        context: makeContext({ includeBooking: true }),
      }),
    );

    expect(decision.intent).toBe("BOOKING_REQUEST");
    expect(decision.state.stage).toBe("BOOKING_READY");
    expect(decision.shouldEscalate).toBe(false);
    expect(decision.missingFields).toEqual([]);
    expect(decision.leadStatus).toBe("SALES_READY");
  });

  it("keeps Greek conversations in Greek and asks concise follow-ups", () => {
    const decision = runConversationEngine(
      makeInput({
        latestMessage:
          "Καλησπέρα, ενδιαφέρομαι για AI sales assistant setup στην Αθήνα.",
        context: makeContext({ includeBooking: true, includePricing: true }),
      }),
    );

    expect(decision.replyLocale).toBe("EL");
    expect(decision.reply).toContain("Ποιο είναι");
    expect(decision.askedFields).toContain("contact_method");
  });

  it("handles Greeklish leads as Greek-language conversations", () => {
    const decision = runConversationEngine(
      makeInput({
        latestMessage:
          "Kalispera, thelo rantevou gia AI sales assistant setup stin Athina avrio. Email nikos@example.com.",
        context: makeContext({ includeBooking: true, includePricing: true }),
      }),
    );

    expect(decision.replyLocale).toBe("EL");
    expect(decision.intent).toBe("BOOKING_REQUEST");
    expect(decision.mergedLead.email).toBe("nikos@example.com");
    expect(decision.mergedLead.location).toBe("Athens");
    expect(decision.mergedLead.urgency).toBe("immediate");
  });

  it("uses a confidence-aware fallback for unclear low-context messages", () => {
    const decision = runConversationEngine(
      makeInput({
        latestMessage: "Hi",
        context: makeContext({ includeBooking: true, includePricing: true }),
      }),
    );

    expect(decision.intent).toBe("UNKNOWN");
    expect(decision.state.stage).toBe("FALLBACK");
    expect(decision.shouldEscalate).toBe(false);
    expect(decision.reply).toContain("need a little more context");
  });

  it("escalates explicit human handoff requests", () => {
    const decision = runConversationEngine(
      makeInput({
        latestMessage: "I want to talk with a human about our account.",
        context: makeContext({ includeBooking: true, includePricing: true }),
      }),
    );

    expect(decision.intent).toBe("HUMAN_HANDOFF");
    expect(decision.shouldEscalate).toBe(true);
    expect(decision.leadStatus).toBe("HANDED_OFF");
    expect(decision.escalationReason).toMatch(/human handoff/i);
  });
});

function makeInput(input: {
  latestMessage: string;
  context: ReturnType<typeof makeContext>;
}): ConversationEngineInput {
  return {
    workspace: {
      name: "Northline Demo",
      defaultLocale: "EN",
      languageMode: "BILINGUAL",
    },
    lead: {},
    messages: [
      {
        direction: "INBOUND",
        senderType: "LEAD",
        body: input.latestMessage,
      },
    ],
    latestMessage: input.latestMessage,
    businessContext: input.context,
    playbook: defaultQualificationPlaybook,
  };
}

function makeContext(options: {
  includePricing?: boolean;
  includeBooking?: boolean;
} = {}) {
  return assembleBusinessContextBundle({
    workspace: {
      name: "Northline Demo",
      primaryMarket: "GR",
      defaultLocale: "EN",
      languageMode: "BILINGUAL",
    },
    items: [
      item({
        section: "BUSINESS_PROFILE",
        title: "Profile",
        text: "Business profile: Northline Demo",
      }),
      item({
        section: "SERVICES",
        title: "AI sales assistant setup",
        text: "Services or products: AI sales assistant setup\nWhat it includes: inbound lead capture and booking.",
        structuredData: {
          name: "AI sales assistant setup",
          summary: "Inbound lead capture and booking.",
        },
      }),
      options.includePricing
        ? item({
            section: "PRICING",
            title: "Pricing guidance",
            text: "Pricing notes: Pricing guidance\nNotes: Pricing depends on scope and should be confirmed by the team.",
          })
        : null,
      options.includeBooking
        ? item({
            section: "BOOKING_RULES",
            title: "Booking path",
            text: "Booking rules: Booking path\nBooking path: Offer a discovery call after contact details and need are clear.",
          })
        : null,
      item({
        section: "ESCALATION_RULES",
        title: "Escalation",
        text: "Escalation rules: Escalation\nEscalation trigger: price uncertainty or human request.",
      }),
    ].filter(Boolean) as BusinessContextRecord[],
  });
}

function item(input: {
  section: BusinessContextSectionValue;
  title: string;
  text: string;
  structuredData?: Record<string, unknown>;
}): BusinessContextRecord {
  return {
    id: `${input.section}_${input.title}`,
    section: input.section,
    locale: "EN",
    title: input.title,
    rawText: input.text,
    normalizedText: input.text,
    structuredData: input.structuredData ?? {},
    status: "PUBLISHED",
  };
}
