import type { ConversationStatusValue } from "@/lib/channels/types";
import type { BusinessContextBundle } from "@/lib/knowledge/types";

export type EngineLocale = "EN" | "EL";

export type ConversationIntent =
  | "NEW_LEAD_INQUIRY"
  | "PRICING_QUESTION"
  | "BOOKING_REQUEST"
  | "SERVICE_AVAILABILITY"
  | "HUMAN_HANDOFF"
  | "UNKNOWN";

export type LeadFieldKey =
  | "name"
  | "phone"
  | "email"
  | "contact_method"
  | "preferred_contact_method"
  | "service_interest"
  | "budget"
  | "location"
  | "urgency"
  | "booking_intent"
  | "freeform_notes";

export type ExtractedLeadFields = {
  name?: string;
  phone?: string;
  email?: string;
  preferredContactMethod?: string;
  serviceInterest?: string;
  budget?: string;
  location?: string;
  urgency?: string;
  bookingIntent?: boolean;
  freeformNotes?: string;
};

export type LeadSnapshot = ExtractedLeadFields & {
  id?: string;
  status?: string;
  score?: number;
  preferredLocale?: EngineLocale | null;
  summary?: string | null;
};

export type EngineMessage = {
  direction: "INBOUND" | "OUTBOUND";
  senderType: "LEAD" | "ASSISTANT" | "HUMAN" | "SYSTEM";
  body: string;
  createdAt?: Date;
};

export type PlaybookQuestion = {
  field: LeadFieldKey;
  label: string;
  required: boolean;
  priority: number;
  prompt: Record<EngineLocale, string>;
};

export type QualificationPlaybookDefinition = {
  name: string;
  version: number;
  requiredFields: LeadFieldKey[];
  questions: PlaybookQuestion[];
  maxFollowUpQuestions: number;
  confidenceThreshold: number;
};

export type ConversationEngineInput = {
  workspace: {
    name: string;
    defaultLocale: EngineLocale;
    languageMode: "GREEK" | "ENGLISH" | "BILINGUAL" | string;
  };
  lead: LeadSnapshot;
  messages: EngineMessage[];
  latestMessage: string;
  businessContext: BusinessContextBundle;
  playbook: QualificationPlaybookDefinition;
};

export type ConversationEngineDecision = {
  intent: ConversationIntent;
  intentConfidence: number;
  replyLocale: EngineLocale;
  extractedFields: ExtractedLeadFields;
  mergedLead: LeadSnapshot;
  missingFields: LeadFieldKey[];
  askedFields: LeadFieldKey[];
  reply: string;
  nextConversationStatus: ConversationStatusValue;
  leadStatus:
    | "NEW"
    | "QUALIFYING"
    | "QUALIFIED"
    | "SALES_READY"
    | "NURTURE"
    | "DISQUALIFIED"
    | "HANDED_OFF";
  score: number;
  confidence: number;
  shouldEscalate: boolean;
  escalationReason?: string;
  summary: string;
  internalNotes: string;
  state: {
    stage:
      | "COLLECTING_DETAILS"
      | "QUALIFIED"
      | "BOOKING_READY"
      | "ESCALATED"
      | "FALLBACK";
    lastIntent: ConversationIntent;
    missingFields: LeadFieldKey[];
    replyLocale: EngineLocale;
    confidence: number;
  };
};
