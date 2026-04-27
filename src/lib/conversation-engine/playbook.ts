import type {
  EngineLocale,
  LeadFieldKey,
  QualificationPlaybookDefinition,
} from "@/lib/conversation-engine/types";

export const defaultRequiredLeadFields: LeadFieldKey[] = [
  "name",
  "contact_method",
  "service_interest",
  "urgency",
];

export const defaultQualificationPlaybook: QualificationPlaybookDefinition = {
  name: "Generic inbound lead qualification",
  version: 1,
  requiredFields: defaultRequiredLeadFields,
  maxFollowUpQuestions: 2,
  confidenceThreshold: 0.55,
  questions: [
    question("name", "Lead name", true, 10, {
      EN: "What is your name?",
      EL: "Ποιο είναι το όνομά σας;",
    }),
    question("contact_method", "Email or phone", true, 20, {
      EN: "What is the best email or phone number for follow-up?",
      EL: "Ποιο είναι το καλύτερο email ή τηλέφωνο για επικοινωνία;",
    }),
    question("service_interest", "Service or product of interest", true, 30, {
      EN: "Which service or product are you interested in?",
      EL: "Για ποια υπηρεσία ή προϊόν ενδιαφέρεστε;",
    }),
    question("urgency", "Timeline or urgency", true, 40, {
      EN: "What timeline are you working with?",
      EL: "Ποιο είναι το χρονοδιάγραμμά σας;",
    }),
    question("location", "Location or service area", false, 50, {
      EN: "Where are you located or where do you need service?",
      EL: "Πού βρίσκεστε ή σε ποια περιοχή χρειάζεστε εξυπηρέτηση;",
    }),
    question("budget", "Budget", false, 60, {
      EN: "Do you have a budget range in mind?",
      EL: "Έχετε κάποιο εύρος προϋπολογισμού στο μυαλό σας;",
    }),
    question("preferred_contact_method", "Preferred contact method", false, 70, {
      EN: "Do you prefer email, phone, or messaging?",
      EL: "Προτιμάτε email, τηλέφωνο ή μήνυμα;",
    }),
  ],
};

export function serializePlaybookConfig(
  playbook: QualificationPlaybookDefinition,
) {
  return {
    name: playbook.name,
    version: playbook.version,
    requiredFields: playbook.requiredFields,
    maxFollowUpQuestions: playbook.maxFollowUpQuestions,
    confidenceThreshold: playbook.confidenceThreshold,
    questions: playbook.questions,
  };
}

export function parsePlaybookConfig(
  value: unknown,
): QualificationPlaybookDefinition {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaultQualificationPlaybook;
  }

  const record = value as Record<string, unknown>;
  const requiredFields = parseFieldArray(record.requiredFields);
  const maxFollowUpQuestions = parsePositiveInt(
    record.maxFollowUpQuestions,
    defaultQualificationPlaybook.maxFollowUpQuestions,
  );
  const confidenceThreshold =
    typeof record.confidenceThreshold === "number"
      ? clamp(record.confidenceThreshold, 0.1, 0.95)
      : defaultQualificationPlaybook.confidenceThreshold;
  const questions = Array.isArray(record.questions)
    ? record.questions.map(parseQuestion).filter(isPlaybookQuestion)
    : [];

  return {
    name:
      typeof record.name === "string" && record.name.trim()
        ? record.name.trim()
        : defaultQualificationPlaybook.name,
    version: parsePositiveInt(record.version, defaultQualificationPlaybook.version),
    requiredFields:
      requiredFields.length > 0
        ? requiredFields
        : defaultQualificationPlaybook.requiredFields,
    maxFollowUpQuestions,
    confidenceThreshold,
    questions:
      questions.length > 0
        ? questions
        : defaultQualificationPlaybook.questions,
  };
}

function question(
  field: LeadFieldKey,
  label: string,
  required: boolean,
  priority: number,
  prompt: Record<EngineLocale, string>,
) {
  return { field, label, required, priority, prompt };
}

function parseQuestion(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const field = parseField(record.field);
  if (!field) return null;
  const prompt = parsePrompt(record.prompt);

  return {
    field,
    label: typeof record.label === "string" ? record.label : field,
    required: record.required === true,
    priority: parsePositiveInt(record.priority, 999),
    prompt,
  };
}

function isPlaybookQuestion(
  value: ReturnType<typeof parseQuestion>,
): value is NonNullable<ReturnType<typeof parseQuestion>> {
  return Boolean(value);
}

function parsePrompt(value: unknown): Record<EngineLocale, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { EN: "Can you share a little more detail?", EL: "Μπορείτε να μοιραστείτε λίγες περισσότερες λεπτομέρειες;" };
  }

  const record = value as Record<string, unknown>;
  return {
    EN:
      typeof record.EN === "string" && record.EN.trim()
        ? record.EN.trim()
        : "Can you share a little more detail?",
    EL:
      typeof record.EL === "string" && record.EL.trim()
        ? record.EL.trim()
        : "Μπορείτε να μοιραστείτε λίγες περισσότερες λεπτομέρειες;",
  };
}

function parseFieldArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(parseField).filter(Boolean) as LeadFieldKey[];
}

function parseField(value: unknown): LeadFieldKey | null {
  return leadFields.has(value as LeadFieldKey) ? (value as LeadFieldKey) : null;
}

function parsePositiveInt(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? Math.round(value)
    : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const leadFields = new Set<LeadFieldKey>([
  "name",
  "phone",
  "email",
  "contact_method",
  "preferred_contact_method",
  "service_interest",
  "budget",
  "location",
  "urgency",
  "booking_intent",
  "freeform_notes",
]);
