import type {
  BusinessContextSectionValue,
  SectionConfig,
} from "@/lib/knowledge/types";

export const sectionConfigs: SectionConfig[] = [
  {
    section: "BUSINESS_PROFILE",
    label: "Business profile",
    shortLabel: "Profile",
    description: "What the business does, who it helps, and how it should sound.",
    critical: true,
    fields: [
      {
        key: "description",
        label: "Business description",
        placeholder: "We help property owners in Athens qualify tenants and book viewings.",
        required: true,
        multiline: true,
      },
      {
        key: "idealCustomers",
        label: "Best-fit customers",
        placeholder: "SMB operators, homeowners, B2B buyers...",
        multiline: true,
      },
      {
        key: "tone",
        label: "Tone and operating style",
        placeholder: "Direct, warm, practical, no pressure.",
      },
    ],
  },
  {
    section: "SERVICES",
    label: "Services or products",
    shortLabel: "Services",
    description: "What Northline can confidently discuss and qualify.",
    critical: true,
    fields: [
      { key: "name", label: "Service or product", placeholder: "Demo booking", required: true },
      {
        key: "summary",
        label: "What it includes",
        placeholder: "Initial consultation, needs assessment, next-step plan...",
        required: true,
        multiline: true,
      },
      { key: "availability", label: "Availability", placeholder: "Athens, Greece-wide, Europe-wide, online..." },
    ],
  },
  {
    section: "PRICING",
    label: "Pricing notes",
    shortLabel: "Pricing",
    description: "How pricing should be explained without overpromising.",
    critical: false,
    fields: [
      { key: "priceModel", label: "Pricing model", placeholder: "From EUR 500/month, custom quote, free consultation..." },
      { key: "notes", label: "Notes", placeholder: "Mention that final pricing depends on scope.", multiline: true },
      { key: "doNotSay", label: "Avoid saying", placeholder: "Do not promise discounts or exact totals without review.", multiline: true },
    ],
  },
  {
    section: "FAQ",
    label: "FAQs",
    shortLabel: "FAQs",
    description: "Questions the assistant should answer consistently.",
    critical: true,
    fields: [
      { key: "question", label: "Question", placeholder: "How fast can we get started?", required: true },
      { key: "answer", label: "Answer", placeholder: "Most setups can start after a short discovery call.", required: true, multiline: true },
    ],
  },
  {
    section: "LOCATIONS",
    label: "Locations and service areas",
    shortLabel: "Locations",
    description: "Where the business operates and any local constraints.",
    critical: false,
    fields: [
      { key: "locationName", label: "Location or area", placeholder: "Athens office, Greece-wide, EU remote..." },
      { key: "address", label: "Address", placeholder: "Street, city, country" },
      { key: "notes", label: "Notes", placeholder: "Remote calls available for EU clients.", multiline: true },
    ],
  },
  {
    section: "OPENING_HOURS",
    label: "Opening hours",
    shortLabel: "Hours",
    description: "When to offer meetings, callbacks, or human handoff.",
    critical: false,
    fields: [
      { key: "timezone", label: "Timezone", placeholder: "Europe/Athens", required: true },
      { key: "hours", label: "Hours", placeholder: "Monday-Friday, 09:00-18:00", required: true, multiline: true },
      { key: "exceptions", label: "Exceptions", placeholder: "Closed on Greek public holidays.", multiline: true },
    ],
  },
  {
    section: "QUALIFICATION_RULES",
    label: "Lead qualification rules",
    shortLabel: "Qualification",
    description: "What to ask and how to judge fit before handoff.",
    critical: true,
    fields: [
      { key: "rule", label: "Rule", placeholder: "Ask for company size and timeline before booking.", required: true, multiline: true },
      { key: "priority", label: "Priority", placeholder: "High, medium, low" },
      { key: "disqualifiers", label: "Disqualifiers", placeholder: "No valid contact details, outside service area...", multiline: true },
    ],
  },
  {
    section: "BOOKING_RULES",
    label: "Booking rules",
    shortLabel: "Booking",
    description: "When and how the assistant should suggest appointments.",
    critical: true,
    fields: [
      { key: "bookingPath", label: "Booking path", placeholder: "Offer a discovery call after collecting name, email, and need.", required: true, multiline: true },
      { key: "duration", label: "Default duration", placeholder: "30 minutes" },
      { key: "constraints", label: "Constraints", placeholder: "Do not book same-day appointments after 14:00.", multiline: true },
    ],
  },
  {
    section: "ESCALATION_RULES",
    label: "Escalation rules",
    shortLabel: "Escalation",
    description: "When a person should take over.",
    critical: true,
    fields: [
      { key: "trigger", label: "Escalation trigger", placeholder: "Lead asks for legal terms, complains, or requests enterprise pricing.", required: true, multiline: true },
      { key: "destination", label: "Handoff destination", placeholder: "Owner inbox, sales team, support manager" },
      { key: "urgency", label: "Urgency", placeholder: "Immediate, same business day, next business day" },
    ],
  },
  {
    section: "CUSTOM_NOTES",
    label: "Custom business notes",
    shortLabel: "Notes",
    description: "Additional policies, phrases, or context not covered elsewhere.",
    critical: false,
    fields: [
      { key: "note", label: "Note", placeholder: "Use this approved wording when explaining implementation timelines.", required: true, multiline: true },
    ],
  },
];

export function getSectionConfig(section: string) {
  return (
    sectionConfigs.find((config) => config.section === section) ??
    sectionConfigs[0]
  );
}

export function isBusinessContextSection(
  value: string,
): value is BusinessContextSectionValue {
  return sectionConfigs.some((config) => config.section === value);
}

export function getCriticalSections() {
  return sectionConfigs
    .filter((config) => config.critical)
    .map((config) => config.section);
}
