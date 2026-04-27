import type { ConversationIntent } from "@/lib/conversation-engine/types";
import { analyzeText } from "@/lib/language";

type IntentRule = {
  intent: ConversationIntent;
  weight: number;
  patterns: RegExp[];
};

const intentRules: IntentRule[] = [
  {
    intent: "HUMAN_HANDOFF",
    weight: 1,
    patterns: [
      /\b(human|person|operator|agent|support|manager|complain|complaint)\b/i,
      /\b(talk|speak|call)\s+(to|with)\s+(someone|a person|an agent)\b/i,
      /\b(ανθρωπο|εκπροσωπο|υπαλληλο|υποστηριξη|παραπονο|μιλησω)\b/i,
    ],
  },
  {
    intent: "BOOKING_REQUEST",
    weight: 0.92,
    patterns: [
      /\b(book|booking|schedule|appointment|meeting|demo|call)\b/i,
      /\b(ραντεβου|κλεισω|κλεισουμε|συναντηση|τηλεφωνημα|rantevou|kleiso|demo)\b/i,
    ],
  },
  {
    intent: "PRICING_QUESTION",
    weight: 0.88,
    patterns: [
      /\b(price|pricing|cost|quote|budget|fee|how much)\b/i,
      /\b(τιμη|κοστοσ|κοστιζει|ποσο|προσφορα|χρεωση|timi|kostos|poso|budget)\b/i,
    ],
  },
  {
    intent: "SERVICE_AVAILABILITY",
    weight: 0.78,
    patterns: [
      /\b(available|availability|serve|service area|do you offer|can you help)\b/i,
      /\b(διαθεσιμο|διαθεσιμοτητα|εξυπηρετειτε|περιοχη|προσφερετε|μπορειτε)\b/i,
    ],
  },
  {
    intent: "NEW_LEAD_INQUIRY",
    weight: 0.62,
    patterns: [
      /\b(interested|need|looking for|want|inquiry|information|details)\b/i,
      /\b(ενδιαφερομαι|χρειαζομαι|ψαχνω|θελω|πληροφοριεσ|λεπτομερειεσ|endiaferomai|thelo)\b/i,
    ],
  },
];

export function detectIntent(message: string): {
  intent: ConversationIntent;
  confidence: number;
  signals: string[];
} {
  const analysis = analyzeText(message);
  const searchable = analysis.searchText;
  if (!searchable) {
    return { intent: "UNKNOWN", confidence: 0, signals: [] };
  }

  const scores = new Map<ConversationIntent, { score: number; signals: string[] }>();
  for (const rule of intentRules) {
    for (const pattern of rule.patterns) {
      const match = searchable.match(pattern);
      if (!match) continue;
      const current = scores.get(rule.intent) ?? { score: 0, signals: [] };
      current.score += rule.weight;
      current.signals.push(match[0]);
      scores.set(rule.intent, current);
    }
  }

  if (scores.size === 0) {
    const fallbackConfidence = searchable.length >= 24 ? 0.42 : 0.25;
    return {
      intent: fallbackConfidence >= 0.4 ? "NEW_LEAD_INQUIRY" : "UNKNOWN",
      confidence: fallbackConfidence,
      signals: [],
    };
  }

  const ranked = Array.from(scores.entries()).sort(
    (a, b) => b[1].score - a[1].score,
  );
  const [intent, result] = ranked[0];
  const confidence = Math.min(0.98, 0.35 + result.score * 0.35);

  return { intent, confidence, signals: result.signals };
}
