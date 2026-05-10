import type { Metadata } from "next";
import {
  CalendarCheck,
  DatabaseZap,
  Handshake,
  PlugZap,
} from "lucide-react";
import { PublicRoutePage } from "@/components/marketing/public-route-page";
import { marketingCopy } from "@/content/marketing";
import { createPageMetadata } from "@/lib/seo";

const en = marketingCopy.en;
const el = marketingCopy.el;

const destinationCards = [
  {
    title: "Calendar and booking paths",
    body:
      "Qualified leads can move toward a meeting, consultation, appointment, or internal booking flow.",
    icon: CalendarCheck,
    secondaryTitle: "Calendar και booking paths",
    secondaryBody:
      "Τα qualified leads μπορούν να πάνε σε meeting, consultation, appointment ή εσωτερική booking ροή.",
  },
  {
    title: "CRM and webhook sync",
    body:
      "Structured lead fields are prepared for CRM records, webhook payloads, and internal systems.",
    icon: PlugZap,
    secondaryTitle: "CRM και webhook sync",
    secondaryBody:
      "Τα structured lead fields προετοιμάζονται για CRM records, webhook payloads και εσωτερικά συστήματα.",
  },
  {
    title: "Human handoff",
    body:
      "Low-confidence, sensitive, or high-value conversations can route to a person with summary context.",
    icon: Handshake,
    secondaryTitle: "Human handoff",
    secondaryBody:
      "Low-confidence, sensitive ή high-value conversations μπορούν να πάνε σε άνθρωπο με summary context.",
  },
  {
    title: "Sync-ready payloads",
    body:
      "The marketing promise stays aligned with the app destination model without exposing private app data.",
    icon: DatabaseZap,
    secondaryTitle: "Payloads έτοιμα για sync",
    secondaryBody:
      "Το public μήνυμα μένει aligned με το app destination model χωρίς να εκθέτει private app data.",
  },
] as const;

export const metadata: Metadata = createPageMetadata({
  title: "Destinations",
  description:
    "How Northline routes qualified leads to booking paths, CRM records, webhooks, and human handoff destinations.",
  path: "/destinations",
});

export default function DestinationsRoute() {
  return (
    <PublicRoutePage
      hero={{
        eyebrow: "Destinations",
        title: "Send qualified leads to the right next step.",
        body:
          "Public destination messaging explains where a lead can go after qualification: booking, CRM, webhook, or a human teammate.",
      }}
      languageNote="The public destinations route is separate from the authenticated app destination screen and stays available without database or auth access."
      languagePanels={[
        {
          label: en.languageLabel,
          eyebrow: "Routing outcomes",
          title: "Booking, systems, and human handoff stay connected.",
          body:
            "Northline keeps lead source, consent, language, qualification state, and next action available when a conversation moves out of chat.",
          points: [
            "Calendar or appointment paths",
            "CRM and webhook destinations",
            "Human handoff with summary context",
          ],
        },
        {
          label: el.languageLabel,
          eyebrow: "Routing outcomes",
          title: "Booking, συστήματα και human handoff μένουν συνδεδεμένα.",
          body:
            "Το Northline κρατά source, consent, γλώσσα, qualification state και επόμενη ενέργεια όταν η συζήτηση φεύγει από το chat.",
          points: [
            "Calendar ή appointment paths",
            "CRM και webhook destinations",
            "Human handoff με summary context",
          ],
        },
      ]}
      cardsEyebrow="Destination paths"
      cardsTitle="The route is public; the operational screen remains private."
      cardsBody="This page is static marketing content. The authenticated /app/destinations page still owns real destination configuration."
      cards={destinationCards}
      cta={{
        eyebrow: "Destination planning",
        title: "Decide what should happen after qualification.",
        body:
          "Use the preview request to describe whether your next action is booking, CRM sync, webhook delivery, or human review.",
        primaryLabel: en.cta.primary,
        primaryHref: "/contact?intent=demo",
        secondaryLabel: "See workflow",
        secondaryHref: "/how-it-works",
      }}
    />
  );
}
