import {
  ArrowRight,
  BookOpenText,
  CalendarCheck,
  CheckCircle2,
  DatabaseZap,
  Handshake,
  Inbox,
  Languages,
  MessageSquareText,
  Route,
  ShieldCheck,
  Webhook,
} from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { ConversionForm } from "@/components/marketing/conversion-form";
import { FeatureBlock } from "@/components/marketing/feature-block";
import { FaqItem } from "@/components/marketing/faq-item";
import { PricingCard } from "@/components/marketing/pricing-card";
import { ProductVisual } from "@/components/marketing/product-visual";
import { Section, SectionHeader } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";
import { ButtonLink } from "@/components/ui/button-link";
import { marketingEvents } from "@/lib/marketing-events";
import { cta, homePage, pricingPage } from "@/content/website";
import type { Locale } from "@/content/marketing";

const workflowIcons = [Inbox, MessageSquareText, Route, Handshake];
const featureIcons = [
  Inbox,
  BookOpenText,
  ShieldCheck,
  CalendarCheck,
  DatabaseZap,
  Handshake,
];
const featureAccents = ["teal", "violet", "blue", "amber", "teal", "rose"] as const;

type MarketingPageProps = {
  locale?: Locale;
};

export function MarketingPage({ locale = "en" }: MarketingPageProps) {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WebsiteHeader />

      <section className="relative isolate overflow-hidden border-b border-border bg-canvas">
        <div className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(var(--color-ink)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink)_1px,transparent_1px)] [background-size:52px_52px]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-36 border-t border-border bg-gradient-to-b from-transparent to-subtle/80" />
        <div className="mx-auto grid min-h-[82svh] max-w-7xl items-center gap-12 px-[var(--space-page)] py-16 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div>
            <Badge tone="teal">{homePage.hero.eyebrow}</Badge>
            <h1 className="mt-6 max-w-4xl text-title-lg font-black leading-[0.97] text-balance sm:text-display lg:text-display-xl">
              {homePage.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-body-lg leading-[var(--line-height-copy)] text-muted">
              {homePage.hero.body}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href="/contact?intent=demo"
                icon={ArrowRight}
                size="lg"
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel={cta.requestDemo}
                analyticsLocation="home_hero"
              >
                {cta.requestDemo}
              </ButtonLink>
              <ButtonLink
                href="/pricing"
                tone="secondary"
                icon={CalendarCheck}
                size="lg"
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel={cta.seePricing}
                analyticsLocation="home_hero"
              >
                {cta.seePricing}
              </ButtonLink>
            </div>
            <ul className="mt-9 grid max-w-2xl gap-3 text-body-sm text-muted sm:grid-cols-3">
              {homePage.hero.bullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-teal"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            <ProductVisual locale={locale} compact />
            <ConversionForm
              type="demo"
              title="Get a preview walkthrough"
              body="Tell us where inbound leads come from today. We will shape the demo around your workflow."
              submitLabel={cta.requestDemo}
              location="home_hero"
              compact
            />
          </div>
        </div>
      </section>

      <Section aria-label="Trust and proof" tight>
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <SectionHeader
            eyebrow={homePage.trust.eyebrow}
            title={homePage.trust.title}
          />
          <div className="grid gap-4">
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
              {homePage.trust.metrics.map((metric) => (
                <div key={metric.label} className="bg-raised p-6">
                  <p className="font-mono text-title font-black text-ink">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-body-sm font-bold text-muted">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {homePage.trust.proof.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-border bg-raised p-4 text-body-sm font-bold leading-6 shadow-card"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section id="product" tone="raised">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeader
            eyebrow={homePage.problemSolution.eyebrow}
            title={homePage.problemSolution.title}
          />
          <div className="grid gap-4">
            <div className="rounded-md border border-border bg-canvas p-6 shadow-card">
              <Badge tone="rose">Problem</Badge>
              <p className="mt-4 text-body leading-7 text-muted">
                {homePage.problemSolution.problem}
              </p>
            </div>
            <div className="rounded-md border border-border bg-canvas p-6 shadow-card">
              <Badge tone="teal">Solution</Badge>
              <p className="mt-4 text-body leading-7 text-muted">
                {homePage.problemSolution.solution}
              </p>
              <ul className="mt-5 grid gap-3">
                {homePage.problemSolution.points.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-body-sm font-bold leading-6 text-ink"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-1 size-4 shrink-0 text-teal"
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      <Section id="how-it-works">
        <SectionHeader
          eyebrow={homePage.howItWorks.eyebrow}
          title={homePage.howItWorks.title}
          align="center"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homePage.howItWorks.steps.map((step, index) => {
            const Icon = workflowIcons[index] ?? Route;

            return (
              <article
                key={step.title}
                className="rounded-md border border-border bg-raised p-6 shadow-card"
              >
                <span className="grid size-10 place-items-center rounded-md bg-teal-soft text-teal-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 text-title-sm font-black">{step.title}</h3>
                <p className="mt-3 text-body-sm leading-6 text-muted">
                  {step.body}
                </p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section id="channels" tone="subtle">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionHeader
            eyebrow={homePage.channels.eyebrow}
            title={homePage.channels.title}
            body={homePage.channels.body}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {homePage.channels.items.map((channel) => (
              <div
                key={channel}
                className="flex items-center gap-3 rounded-md border border-border bg-raised p-4 text-body-sm font-black shadow-card"
              >
                <Webhook aria-hidden="true" className="size-4 text-blue" />
                <span>{channel}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <SectionHeader
          eyebrow={homePage.features.eyebrow}
          title={homePage.features.title}
          align="center"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {homePage.features.items.map((feature, index) => {
            const Icon = featureIcons[index] ?? ShieldCheck;
            const accent = featureAccents[index] ?? "teal";

            return (
              <FeatureBlock
                key={feature.title}
                title={feature.title}
                body={feature.body}
                icon={Icon}
                accent={accent}
              />
            );
          })}
        </div>
      </Section>

      <Section tone="raised">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <SectionHeader
            eyebrow={homePage.useCases.eyebrow}
            title={homePage.useCases.title}
            body={homePage.useCases.body}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {homePage.useCases.items.map((item) => (
              <div
                key={item}
                className="rounded-md border border-border bg-canvas px-5 py-4 text-body-sm font-black shadow-card"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="preview">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <SectionHeader
            eyebrow={homePage.preview.eyebrow}
            title={homePage.preview.title}
            body={homePage.preview.body}
          />
          <ProductVisual locale={locale} />
        </div>
      </Section>

      <Section id="pricing" tone="raised">
        <SectionHeader
          eyebrow={homePage.pricingTeaser.eyebrow}
          title={homePage.pricingTeaser.title}
          body={homePage.pricingTeaser.body}
          align="center"
        />
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
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
              analyticsLocation="home_pricing_teaser"
            />
          ))}
        </div>
      </Section>

      <Section id="faq">
        <div className="mx-auto max-w-4xl">
          <SectionHeader
            eyebrow={homePage.faq.eyebrow}
            title={homePage.faq.title}
            align="center"
          />
          <div className="mt-10 rounded-lg border border-border bg-raised px-5 sm:px-8">
            {homePage.faq.items.map((item) => (
              <FaqItem
                key={item.question}
                question={item.question}
                answer={item.answer}
              />
            ))}
          </div>
        </div>
      </Section>

      <section
        id="contact"
        className="bg-canvas px-[var(--space-page)] py-[var(--space-section)]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-border bg-ink p-6 text-canvas shadow-soft sm:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <p className="text-caption font-black uppercase text-teal-soft">
              {homePage.finalCta.eyebrow}
            </p>
            <h2 className="mt-4 text-title font-black leading-[var(--line-height-title)] sm:text-title-lg">
              {homePage.finalCta.title}
            </h2>
            <p className="mt-5 max-w-2xl text-body leading-7 text-canvas/75">
              {homePage.finalCta.body}
            </p>
            <ButtonLink
              href="/contact"
              tone="ghost"
              className="mt-8 text-canvas hover:bg-white/10"
              icon={Languages}
              analyticsEvent={marketingEvents.ctaClick}
              analyticsLabel="Open contact page"
              analyticsLocation="home_final_cta"
            >
              More contact options
            </ButtonLink>
          </div>
          <ConversionForm
            type="waitlist"
            title="Join the early-access list"
            body="Get notified as the app shell, inbox, and channel workflows become available for preview."
            submitLabel={cta.joinWaitlist}
            location="home_final_cta"
            compact
          />
        </div>
      </section>

      <WebsiteFooter />
    </main>
  );
}
