import type {
  ConversationEngineDecision,
  LeadSnapshot,
} from "@/lib/conversation-engine/types";
import { analyzeText } from "@/lib/language";

export type AiResponderStateValue = "ACTIVE" | "PAUSED";
export type ActiveHandoffStatusValue =
  | "REQUESTED"
  | "ACCEPTED"
  | "RESOLVED"
  | "CANCELLED";

export type AutomaticHandoffDecision =
  | {
      shouldHandoff: true;
      reason: string;
      severity: "normal" | "high";
      trigger:
        | "engine_escalation"
        | "low_confidence"
        | "sensitive_issue"
        | "urgent_or_high_value";
    }
  | { shouldHandoff: false };

export function isAiPausedForHandoff(input: {
  aiResponderState?: AiResponderStateValue | string | null;
  activeHandoffStatus?: ActiveHandoffStatusValue | string | null;
}) {
  return (
    input.aiResponderState === "PAUSED" ||
    input.activeHandoffStatus === "REQUESTED" ||
    input.activeHandoffStatus === "ACCEPTED"
  );
}

export function resolveAutomaticHandoff(input: {
  decision: ConversationEngineDecision;
  latestMessage: string;
  lead?: LeadSnapshot;
}): AutomaticHandoffDecision {
  if (input.decision.shouldEscalate) {
    return {
      shouldHandoff: true,
      reason:
        input.decision.escalationReason ??
        "Conversation engine requested human review.",
      severity: "normal",
      trigger: "engine_escalation",
    };
  }

  if (
    input.decision.state.stage === "FALLBACK" ||
    input.decision.confidence < 0.55 ||
    input.decision.intentConfidence < 0.45
  ) {
    return {
      shouldHandoff: true,
      reason: "Low-confidence or fallback state needs operator review.",
      severity: "normal",
      trigger: "low_confidence",
    };
  }

  if (hasSensitiveIssueSignal(input.latestMessage)) {
    return {
      shouldHandoff: true,
      reason:
        "Complaint, policy, privacy, legal, or sensitive issue needs human handling.",
      severity: "high",
      trigger: "sensitive_issue",
    };
  }

  if (
    isUrgentOrHighValue({
      latestMessage: input.latestMessage,
      lead: input.decision.mergedLead ?? input.lead,
      score: input.decision.score,
    })
  ) {
    return {
      shouldHandoff: true,
      reason: "Urgent or high-value lead needs operator attention.",
      severity: "high",
      trigger: "urgent_or_high_value",
    };
  }

  return { shouldHandoff: false };
}

function hasSensitiveIssueSignal(message: string) {
  const { searchText } = analyzeText(message);
  return sensitiveIssuePatterns.some((pattern) => pattern.test(searchText));
}

function isUrgentOrHighValue(input: {
  latestMessage: string;
  lead?: LeadSnapshot;
  score: number;
}) {
  const analysis = analyzeText(input.latestMessage);
  const urgency = `${input.lead?.urgency ?? ""} ${analysis.searchText}`;
  const budgetSignal =
    /\b(budget|cost|price|quote|eur|euro|euros|προυπολογισμοσ|κοστοσ|τιμη)\b|€/i.test(
      `${analysis.searchText} ${input.latestMessage}`,
    );
  const budgetText = input.lead?.budget ?? (budgetSignal ? analysis.searchText : "");
  const highValueBudget = extractAmount(budgetText) >= 1000;

  return (
    input.score >= 85 ||
    highValueBudget ||
    /\b(asap|urgent|today|tomorrow|immediately|now|σημερα|αυριο|αμεσα|επείγον|amesa|avrio)\b/i.test(
      urgency,
    )
  );
}

function extractAmount(value: string) {
  const match = value.match(/(?:€|\b(?:eur|euro|euros|budget)\b)?\s*(\d[\d.,]*)/i);
  if (!match?.[1]) return 0;

  const raw = match[1];
  const normalized =
    /[.,]\d{3}\b/.test(raw) && !/[.,]\d{1,2}\b/.test(raw)
      ? raw.replace(/[.,]/g, "")
      : raw.replace(/,/g, ".");
  const amount = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

const sensitiveIssuePatterns = [
  /\b(complaint|complain|angry|unacceptable|refund|legal|lawyer|lawsuit|privacy|gdpr|personal data|breach|cancel my account)\b/i,
  /(παραπονο|καταγγελια|θυμωμεν|απαραδεκτ|επιστροφη|νομικ|δικηγορο|προσωπικα δεδομενα|ακυρωση)/i,
  /\b(parapono|kataggelia|nomik|dikhgoro|prosopika dedomena|akyrosi)\b/i,
];
