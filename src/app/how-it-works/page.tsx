import type { Metadata } from "next";
import {
  CalendarCheck,
  ClipboardList,
  Handshake,
  Inbox,
} from "lucide-react";
import { PublicRoutePage } from "@/components/marketing/public-route-page";
import { marketingCopy } from "@/content/marketing";
import { createPageMetadata } from "@/lib/seo";

const en = marketingCopy.en;
const el = marketingCopy.el;
const icons = [Inbox, ClipboardList, CalendarCheck, Handshake] as const;

export const metadata: Metadata = createPageMetadata({
  title: "How it works",
  description:
    "How Northline captures, qualifies, converts, and hands off inbound leads from chat and messaging channels.",
  path: "/how-it-works",
});

export default function HowItWorksRoute() {
  return (
    <PublicRoutePage
      hero={{
        eyebrow: "How it works",
        title: "A clear path from first message to next action.",
        body:
          "Northline keeps the sales process simple: collect the lead, ask the right questions, recommend the next step, and hand off with context.",
      }}
      languageNote="The workflow is described in English and Greek so preview conversations can evaluate both operating languages from the start."
      languagePanels={[
        {
          label: en.languageLabel,
          eyebrow: en.workflow.eyebrow,
          title: en.workflow.title,
          body: en.problem.body,
          points: en.workflow.steps.map((step) => step.title),
        },
        {
          label: el.languageLabel,
          eyebrow: el.workflow.eyebrow,
          title: el.workflow.title,
          body: el.problem.body,
          points: el.workflow.steps.map((step) => step.title),
        },
      ]}
      cardsEyebrow="Workflow"
      cardsTitle="Capture, qualify, convert, and hand off."
      cardsBody="The route is a static marketing page that mirrors the home-page workflow without pulling from app data."
      cards={en.workflow.steps.map((step, index) => ({
        title: step.title,
        body: step.body,
        icon: icons[index] ?? ClipboardList,
        secondaryTitle: el.workflow.steps[index]?.title,
        secondaryBody: el.workflow.steps[index]?.body,
      }))}
      cta={{
        eyebrow: "Preview walkthrough",
        title: "Review the workflow against real inbound lead paths.",
        body:
          "Use the demo request to describe your current channels, qualification questions, and handoff process.",
        primaryLabel: en.cta.primary,
        primaryHref: "/contact?intent=demo",
        secondaryLabel: "See solutions",
        secondaryHref: "/solutions",
      }}
    />
  );
}
