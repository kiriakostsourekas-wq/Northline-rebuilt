import type {
  ConversationEngineDecision,
  ConversationEngineInput,
  ConversationIntent,
  EngineLocale,
  ExtractedLeadFields,
} from "@/lib/conversation-engine/types";

export type LlmMode = "off" | "mock" | "groq";
export type LlmProviderName = "disabled" | "mock" | "groq";

export type LlmTaskType =
  | "intent_classification"
  | "language_detection"
  | "field_extraction"
  | "reply_generation"
  | "conversation_summary"
  | "handoff_summary";

export type LlmModelClass = "fast" | "generation";
export type LlmResponseFormat = "json" | "text";

export type LlmChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmPromptPacket = {
  id: string;
  version: string;
  task: LlmTaskType;
  messages: LlmChatMessage[];
  responseFormat: LlmResponseFormat;
  modelClass: LlmModelClass;
  temperature: number;
  maxOutputTokens: number;
};

export type LlmProviderRequest = LlmPromptPacket & {
  timeoutMs: number;
};

export type LlmTokenUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
};

export type LlmProviderResponse = {
  content: string;
  model?: string;
  requestId?: string;
  usage?: LlmTokenUsage;
};

export interface LlmProvider {
  readonly name: LlmProviderName;
  readonly isEnabled: boolean;
  invoke(request: LlmProviderRequest): Promise<LlmProviderResponse>;
}

export type LlmTaskTrace = {
  task: LlmTaskType;
  provider: LlmProviderName;
  promptId: string;
  promptVersion: string;
  model?: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  usage?: LlmTokenUsage;
};

export type LlmTaskResult<T> =
  | {
      ok: true;
      value: T;
      trace: LlmTaskTrace;
    }
  | {
      ok: false;
      fallbackReason: string;
      trace: LlmTaskTrace;
    };

export type LlmProviderConfig = {
  mode: LlmMode;
  timeoutMs: number;
  retryCount: number;
  groq: {
    apiKey?: string;
    baseUrl: string;
    fastModel: string;
    generationModel: string;
  };
};

export type LlmContextPacket = {
  workspace: {
    name: string;
    defaultLocale: EngineLocale;
    languageMode: string;
    primaryMarket?: string;
  };
  languagePolicy: {
    allowedLocales: EngineLocale[];
    preferredLocale: EngineLocale;
    instruction: string;
  };
  conversationState: {
    latestMessage: string;
    recentMessages: Array<{
      direction: "INBOUND" | "OUTBOUND";
      senderType: string;
      body: string;
    }>;
    intent?: ConversationIntent;
    stage?: string;
    missingFields: string[];
    askedFields: string[];
    shouldEscalate: boolean;
    escalationReason?: string;
  };
  lead: ExtractedLeadFields & {
    preferredLocale?: EngineLocale | null;
    status?: string;
    score?: number;
    summary?: string | null;
  };
  businessRules: {
    playbookName: string;
    playbookVersion: number;
    requiredFields: string[];
    maxFollowUpQuestions: number;
    safeguards: string[];
  };
  retrievalResults: Array<{
    id: string;
    section: string;
    title: string;
    locale: EngineLocale | null;
    text: string;
  }>;
  allowedActions: string[];
  warnings: string[];
};

export type LlmTaskInput = {
  conversation: ConversationEngineInput;
  decision?: ConversationEngineDecision;
};

export type LlmIntentClassification = {
  intent: ConversationIntent;
  confidence: number;
};

export type LlmLanguageDetection = {
  locale: EngineLocale;
  confidence: number;
  needsConfirmation: boolean;
};

export type LlmFieldExtraction = {
  fields: ExtractedLeadFields;
  confidence: number;
};

export type LlmReplyGeneration = {
  reply: string;
  confidence: number;
};

export type LlmConversationSummary = {
  summary: string;
  confidence: number;
};

export type LlmHandoffSummary = {
  summary: string;
  recommendedNextStep: string;
  confidence: number;
};
