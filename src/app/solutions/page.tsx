import type { Metadata } from "next";
import {
  BookOpenText,
  CalendarCheck,
  ClipboardList,
  Inbox,
  Languages,
  ShieldCheck,
} from "lucide-react";
import { PublicRoutePage } from "@/components/marketing/public-route-page";
import { marketingCopy } from "@/content/marketing";
import { createPageMetadata } from "@/lib/seo";

const en = marketingCopy.en;
const el = marketingCopy.el;
const icons = [
  Inbox,
  BookOpenText,
  ClipboardList,
  CalendarCheck,
  Languages,
  ShieldCheck,
] as const;

export const metadata: Metadata = createPageMetadata({
  title: "Solutions",
  description:
    "Northline solutions for inbound lead capture, qualification, booking, routing, and human handoff.",
  path: "/solutions",
});

export default function SolutionsRoute() {
  return (
    <PublicRoutePage
      hero={{
        eyebrow: "Solutions",
        title: "One operating layer for inbound lead handling.",
        body:
          "Northline turns website chat and messaging inquiries into a structured sales workflow: capture, qualification, booking, routing, and handoff.",
      }}
      languageNote="Solution pages keep English and Greek visible together because the product is built around both launch languages."
      languagePanels={[
        {
          label: en.languageLabel,
          eyebrow: en.platform.eyebrow,
          title: en.platform.title,
          body: en.platform.body,
          points: en.platform.capabilities.map((item) => item.title),
        },
        {
          label: el.languageLabel,
          eyebrow: el.platform.eyebrow,
          title: el.platform.title,
          body: el.platform.body,
          points: el.platform.capabilities.map((item) => item.title),
        },
      ]}
      cardsEyebrow="Solution areas"
      cardsTitle="The public product story matches the app foundation."
      cardsBody="These are static marketing descriptions only. They do not require database access, authentication, or production-domain changes."
      cards={en.platform.capabilities.map((item, index) => ({
        title: item.title,
        body: item.body,
        icon: icons[index] ?? ClipboardList,
        secondaryTitle: el.platform.capabilities[index]?.title,
        secondaryBody: el.platform.capabilities[index]?.body,
      }))}
      cta={{
        eyebrow: "Preview access",
        title: "Map Northline to your inbound lead workflow.",
        body:
          "Share where leads arrive today and what should happen after qualification.",
        primaryLabel: en.cta.primary,
        primaryHref: "/contact?intent=demo",
        secondaryLabel: "See pricing",
        secondaryHref: "/pricing",
      }}
    />
  );
}
