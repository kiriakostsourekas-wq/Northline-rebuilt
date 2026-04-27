import { defaultQualificationPlaybook } from "@/lib/conversation-engine/playbook";
import type { ConversationEngineInput } from "@/lib/conversation-engine/types";
import { assembleBusinessContextBundle } from "@/lib/knowledge/context";
import type {
  BusinessContextRecord,
  BusinessContextSectionValue,
} from "@/lib/knowledge/types";

export function makeLlmConversationInput(input: {
  latestMessage: string;
  includePricing?: boolean;
  includeBooking?: boolean;
  languageMode?: string;
}): ConversationEngineInput {
  return {
    workspace: {
      name: "Northline Demo",
      defaultLocale: "EN",
      languageMode: input.languageMode ?? "BILINGUAL",
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
    businessContext: makeBusinessContext({
      includePricing: input.includePricing,
      includeBooking: input.includeBooking,
    }),
    playbook: defaultQualificationPlaybook,
  };
}

export function makeBusinessContext(options: {
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
            text: "Pricing notes: Pricing depends on scope and should be confirmed by the team.",
          })
        : null,
      options.includeBooking
        ? item({
            section: "BOOKING_RULES",
            title: "Booking path",
            text: "Booking rules: Offer a discovery call after contact details and need are clear.",
          })
        : null,
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
