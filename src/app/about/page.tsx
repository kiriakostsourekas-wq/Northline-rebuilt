import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { ConversionForm } from "@/components/marketing/conversion-form";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";
import { aboutPage, cta } from "@/content/website";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description:
    "Northline is being built as a practical AI layer for inbound sales operations in Greece and Europe.",
  path: "/about",
});

export default function AboutRoute() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WebsiteHeader />
      <PageHero
        eyebrow={aboutPage.hero.eyebrow}
        title={aboutPage.hero.title}
        body={aboutPage.hero.body}
      />

      <Section>
        <SectionHeader
          eyebrow="Principles"
          title="The product direction is deliberately practical."
          align="center"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {aboutPage.principles.map((principle) => (
            <article
              key={principle.title}
              className="rounded-md border border-border bg-raised p-6 shadow-card"
            >
              <Badge tone="teal">Principle</Badge>
              <h2 className="mt-5 text-title-sm font-black">
                {principle.title}
              </h2>
              <p className="mt-3 text-body-sm leading-6 text-muted">
                {principle.body}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="raised">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <SectionHeader
            eyebrow="Roadmap"
            title="A clean path from website to product operations."
            body="The rebuild starts with conversion and content clarity, then expands into the app shell and the operational workflows that make Northline useful."
          />
          <ol className="grid gap-3">
            {aboutPage.roadmap.map((item, index) => (
              <li
                key={item}
                className="flex gap-4 rounded-md border border-border bg-canvas p-4 shadow-card"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-teal-soft font-mono text-caption font-black text-teal-strong">
                  {index + 1}
                </span>
                <span className="text-body-sm font-black leading-6">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 rounded-lg border border-border bg-ink p-6 text-canvas shadow-soft sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-caption font-black uppercase text-teal-soft">
              Preview access
            </p>
            <h2 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              Help shape the workflow around real inbound lead problems.
            </h2>
            <ul className="mt-6 grid gap-3 text-body-sm leading-6 text-canvas/80">
              {[
                "Slow response times",
                "Manual qualification",
                "Scheduling friction",
                "Unclear handoffs",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-teal-soft"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <ConversionForm
            type="waitlist"
            title="Join the rebuild preview"
            body="Get updates as app access, inbox workflows, and channel integrations become available."
            submitLabel={cta.joinWaitlist}
            location="about_cta"
            compact
          />
        </div>
      </Section>
      <WebsiteFooter />
    </main>
  );
}
