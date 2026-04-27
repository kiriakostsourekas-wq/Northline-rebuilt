import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { ConversionForm } from "@/components/marketing/conversion-form";
import { FaqItem } from "@/components/marketing/faq-item";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingCard } from "@/components/marketing/pricing-card";
import { Section, SectionHeader } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";
import { ButtonLink } from "@/components/ui/button-link";
import { cta, pricingPage } from "@/content/website";
import { marketingEvents } from "@/lib/marketing-events";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Preview pricing structure for Northline, the AI sales assistant for inbound leads.",
  path: "/pricing",
});

export default function PricingRoute() {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WebsiteHeader />
      <PageHero
        eyebrow={pricingPage.hero.eyebrow}
        title={pricingPage.hero.title}
        body={pricingPage.hero.body}
      >
        <ConversionForm
          type="demo"
          title="Discuss preview access"
          body="Share your channels and sales workflow. We will reply with the most relevant preview path."
          submitLabel={cta.requestDemo}
          location="pricing_hero"
          compact
        />
      </PageHero>

      <Section>
        <div className="grid gap-4 lg:grid-cols-3">
          {pricingPage.plans.map((plan) => (
            <PricingCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              featured={"featured" in plan ? plan.featured : false}
              ctaLabel={cta.requestDemo}
              ctaHref="/contact?intent=demo"
              analyticsLocation="pricing_plans"
            />
          ))}
        </div>
      </Section>

      <Section tone="raised">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            eyebrow="Pricing FAQ"
            title="What to know before preview access."
            align="center"
          />
          <div className="mt-10 rounded-lg border border-border bg-canvas px-5 sm:px-8">
            {pricingPage.faq.map((item) => (
              <FaqItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <ButtonLink
              href="/contact?intent=demo"
              icon={ArrowRight}
              analyticsEvent={marketingEvents.ctaClick}
              analyticsLabel={cta.requestDemo}
              analyticsLocation="pricing_faq"
            >
              {cta.requestDemo}
            </ButtonLink>
          </div>
        </div>
      </Section>
      <WebsiteFooter />
    </main>
  );
}
