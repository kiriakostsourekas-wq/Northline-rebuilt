import type { Metadata } from "next";
import {
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  HeartPulse,
  House,
  Store,
} from "lucide-react";
import { PublicRoutePage } from "@/components/marketing/public-route-page";
import { marketingCopy } from "@/content/marketing";
import { createPageMetadata } from "@/lib/seo";

const en = marketingCopy.en;
const el = marketingCopy.el;

const industryCards = [
  {
    title: "Home and field services",
    body:
      "Qualify service area, urgency, property details, and booking readiness before a team member steps in.",
    icon: House,
    secondaryTitle: "Υπηρεσίες σπιτιού και πεδίου",
    secondaryBody:
      "Ελέγχει περιοχή, επείγον, στοιχεία ακινήτου και readiness για ραντεβού.",
  },
  {
    title: "Clinics and wellness",
    body:
      "Collect inquiry context, preferred language, and next-step intent without promising clinical advice.",
    icon: HeartPulse,
    secondaryTitle: "Κλινικές και wellness",
    secondaryBody:
      "Συλλέγει context, προτίμηση γλώσσας και πρόθεση για επόμενη ενέργεια.",
  },
  {
    title: "Professional services",
    body:
      "Route qualified conversations by need, company size, urgency, and consultation fit.",
    icon: BriefcaseBusiness,
    secondaryTitle: "Professional services",
    secondaryBody:
      "Δρομολογεί leads με βάση ανάγκη, μέγεθος εταιρείας, urgency και fit.",
  },
  {
    title: "Education and training",
    body:
      "Turn course, program, and enrollment questions into structured follow-up records.",
    icon: GraduationCap,
    secondaryTitle: "Εκπαίδευση και training",
    secondaryBody:
      "Μετατρέπει ερωτήσεις για courses και enrollment σε καθαρά follow-up records.",
  },
  {
    title: "Real estate and property",
    body:
      "Capture location, budget, timing, and viewing intent before a salesperson follows up.",
    icon: Building2,
    secondaryTitle: "Real estate και property",
    secondaryBody:
      "Καταγράφει περιοχή, budget, timing και πρόθεση για viewing πριν το follow-up.",
  },
  {
    title: "Hospitality and local commerce",
    body:
      "Handle high-intent local inquiries with consistent language, consent, and routing context.",
    icon: Store,
    secondaryTitle: "Hospitality και local commerce",
    secondaryBody:
      "Χειρίζεται local inquiries με συνεπή γλώσσα, consent και routing context.",
  },
] as const;

export const metadata: Metadata = createPageMetadata({
  title: "Industries",
  description:
    "Industries Northline can support with inbound lead qualification, booking, and handoff workflows.",
  path: "/industries",
});

export default function IndustriesRoute() {
  return (
    <PublicRoutePage
      hero={{
        eyebrow: "Industries",
        title: "Broad by design, template-ready later.",
        body:
          "Northline starts with a general inbound lead workflow that can adapt to service businesses, clinics, professional services, education, property, hospitality, and local commerce.",
      }}
      languageNote="Industry messaging is presented bilingually because Greek and English sales conversations are part of the core product scope."
      languagePanels={[
        {
          label: en.languageLabel,
          eyebrow: en.industries.eyebrow,
          title: en.industries.title,
          body: en.industries.body,
          points: en.industries.items,
        },
        {
          label: el.languageLabel,
          eyebrow: el.industries.eyebrow,
          title: el.industries.title,
          body: el.industries.body,
          points: el.industries.items,
        },
      ]}
      cardsEyebrow="Use cases"
      cardsTitle="The same lead workflow can fit several SMB categories."
      cardsBody="Industry-specific templates can come later; this page keeps the public route live without adding database-backed template logic."
      cards={industryCards}
      cta={{
        eyebrow: "Use case review",
        title: "Bring the industry context to the demo.",
        body:
          "Share your lead source, qualification rules, and booking or handoff path so the preview can be evaluated against a real workflow.",
        primaryLabel: en.cta.primary,
        primaryHref: "/contact?intent=demo",
        secondaryLabel: "See how it works",
        secondaryHref: "/how-it-works",
      }}
    />
  );
}
