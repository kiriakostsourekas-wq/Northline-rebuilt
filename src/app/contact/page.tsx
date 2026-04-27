import type { Metadata } from "next";
import { ConversionForm } from "@/components/marketing/conversion-form";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";
import { Badge } from "@/components/marketing/badge";
import { contactPage, cta, siteConfig } from "@/content/website";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description:
    "Request a Northline demo, join the early-access list, or submit interest in inbound lead automation.",
  path: "/contact",
});

export default function ContactRoute() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WebsiteHeader />
      <PageHero
        eyebrow={contactPage.hero.eyebrow}
        title={contactPage.hero.title}
        body={contactPage.hero.body}
      >
        <div className="rounded-lg border border-border bg-raised p-6 shadow-card">
          <Badge tone="blue">Email</Badge>
          <p className="mt-4 text-title-sm font-black">{siteConfig.email}</p>
          <p className="mt-3 text-body-sm leading-6 text-muted">
            Form submissions are handled inside this preview rebuild. No
            production-domain changes are involved.
          </p>
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {contactPage.cards.map((card) => (
            <article
              key={card.title}
              className="rounded-md border border-border bg-raised p-6 shadow-card"
            >
              <h2 className="text-title-sm font-black">{card.title}</h2>
              <p className="mt-3 text-body-sm leading-6 text-muted">
                {card.body}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="raised">
        <div className="grid gap-6 lg:grid-cols-3">
          <ConversionForm
            type="demo"
            title="Request a demo"
            body="Best if you want to map Northline against your current lead workflow."
            submitLabel={cta.requestDemo}
            location="contact_demo"
          />
          <ConversionForm
            type="waitlist"
            title="Join the waitlist"
            body="Best if you want product updates as preview access develops."
            submitLabel={cta.joinWaitlist}
            location="contact_waitlist"
          />
          <ConversionForm
            type="contact"
            title="Submit interest"
            body="Best if you have a specific integration, channel, or industry use case."
            submitLabel={cta.submitInterest}
            location="contact_interest"
          />
        </div>
      </Section>
      <WebsiteFooter />
    </main>
  );
}
