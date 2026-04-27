import type { Metadata } from "next";
import {
  ArrowRight,
  BookOpenText,
  CalendarCheck,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { FeatureBlock } from "@/components/marketing/feature-block";
import { FaqItem } from "@/components/marketing/faq-item";
import { PricingCard } from "@/components/marketing/pricing-card";
import { ProductVisual } from "@/components/marketing/product-visual";
import { Section, SectionHeader } from "@/components/marketing/section";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { ButtonLink } from "@/components/ui/button-link";
import { marketingCopy } from "@/content/marketing";
import { designTokens } from "@/design/token-catalog";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "Northline marketing design tokens, components, and visual system examples.",
};

export default function StyleGuidePage() {
  const copy = marketingCopy.en;

  return (
    <main className="min-h-screen bg-canvas text-ink">
      <SiteHeader locale="en" copy={copy} />

      <section className="border-b border-border bg-canvas">
        <div className="mx-auto max-w-7xl px-[var(--space-page)] py-16 sm:py-20">
          <Badge tone="violet">Design system</Badge>
          <h1 className="mt-6 max-w-4xl text-title-lg font-black leading-[var(--line-height-title)] text-balance sm:text-display">
            Northline visual system
          </h1>
          <p className="mt-6 max-w-2xl text-body-lg leading-[var(--line-height-copy)] text-muted">
            A light-first SaaS system for trustworthy inbound lead operations,
            built from reusable tokens and components.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/" icon={ArrowRight}>
              Marketing page
            </ButtonLink>
            <ButtonLink href="#components" tone="secondary">
              Components
            </ButtonLink>
          </div>
        </div>
      </section>

      <Section id="tokens" tight>
        <SectionHeader
          eyebrow="Tokens"
          title="Color, type, spacing, shape, border, shadow, and motion."
          body="The runtime source lives in CSS custom properties and is mirrored here as a catalog for review."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {designTokens.colors.map((color) => (
            <article
              key={color.token}
              className="overflow-hidden rounded-md border border-border bg-raised shadow-card"
            >
              <div
                className="h-20 border-b border-border"
                style={{ background: `var(${color.token})` }}
              />
              <div className="p-4">
                <h2 className="text-body-sm font-black">{color.name}</h2>
                <p className="mt-1 font-mono text-caption text-muted">
                  {color.token}
                </p>
                <p className="mt-3 text-caption leading-5 text-muted">
                  {color.usage}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="raised" tight>
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeader
            eyebrow="Typography"
            title="Sharp hierarchy, calm body copy, mono for operational data."
          />
          <div className="grid gap-4">
            {designTokens.typography.map((item) => (
              <article
                key={item.token}
                className="rounded-md border border-border bg-canvas p-5"
              >
                <p className="font-mono text-caption text-muted">{item.token}</p>
                <p
                  className="mt-2 font-black leading-tight"
                  style={{ fontSize: `var(${item.token})` }}
                >
                  {item.sample}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section id="components">
        <SectionHeader
          eyebrow="Components"
          title="Reusable marketing primitives with production UI discipline."
          body="Buttons, badges, cards, feature blocks, testimonials, pricing cards, FAQ rows, CTA sections, and product surfaces share the same token set."
        />

        <div className="mt-10 grid gap-10">
          <div className="rounded-lg border border-border bg-raised p-6 shadow-card">
            <h2 className="text-title-sm font-black">Buttons and badges</h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="#components" icon={ArrowRight}>
                Primary
              </ButtonLink>
              <ButtonLink href="#components" tone="secondary">
                Secondary
              </ButtonLink>
              <ButtonLink href="#components" tone="dark">
                Dark
              </ButtonLink>
              <ButtonLink href="#components" tone="ghost">
                Ghost
              </ButtonLink>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge>Neutral</Badge>
              <Badge tone="teal">Sales ready</Badge>
              <Badge tone="blue">Routed</Badge>
              <Badge tone="amber">Attention</Badge>
              <Badge tone="rose">Handoff</Badge>
              <Badge tone="violet">Knowledge</Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureBlock
              title="Unified inbox"
              body="A shared operational queue for lead conversations."
              icon={Inbox}
              accent="teal"
            />
            <FeatureBlock
              title="Knowledge base"
              body="Ground replies in services, rules, and service areas."
              icon={BookOpenText}
              accent="violet"
            />
            <FeatureBlock
              title="Booking"
              body="Recommend the next available action with context."
              icon={CalendarCheck}
              accent="amber"
            />
            <FeatureBlock
              title="Security"
              body="Consent, audit, and preview-only deployment controls."
              icon={ShieldCheck}
              accent="rose"
            />
          </div>

          <ProductVisual locale="en" />

          <div className="grid gap-4 lg:grid-cols-3">
            {copy.pricing.plans.map((plan) => (
              <PricingCard
                key={plan.name}
                name={plan.name}
                price={plan.price}
                description={plan.description}
                features={plan.features}
                featured={plan.featured}
                ctaLabel={copy.cta.primary}
              />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {copy.testimonials.items.map((item) => (
              <TestimonialCard
                key={item.name}
                quote={item.quote}
                name={item.name}
                role={item.role}
                company={item.company}
              />
            ))}
          </div>

          <div className="rounded-lg border border-border bg-raised px-5 sm:px-8">
            <FaqItem
              question="How should this system scale?"
              answer="Marketing components use the same semantic tokens intended for the future app shell, so navigation, cards, statuses, and operational surfaces can evolve without rewriting the visual language."
            />
            <FaqItem
              question="Does the style guide affect production?"
              answer="No production-domain changes are made or suggested. This route exists in the new rebuild repository for preview review."
            />
          </div>
        </div>
      </Section>

      <Section tone="subtle" tight>
        <SectionHeader
          eyebrow="Token catalog"
          title="Non-color primitives"
          body="Spacing, radii, borders, elevation, and motion are named so future app UI can stay consistent."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ...designTokens.spacing,
            ...designTokens.radii,
            ...designTokens.borders,
            ...designTokens.elevation,
            ...designTokens.motion,
          ].map((token) => (
            <article
              key={token.token}
              className="rounded-md border border-border bg-raised p-5 shadow-card"
            >
              <h2 className="text-body-sm font-black">{token.name}</h2>
              <p className="mt-2 font-mono text-caption text-muted">
                {token.token}
              </p>
              <p className="mt-3 text-caption leading-5 text-muted">
                {token.usage}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <section className="bg-canvas px-[var(--space-page)] py-[var(--space-section)]">
        <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-border bg-ink p-6 text-canvas shadow-soft sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <Badge tone="teal">CTA system</Badge>
            <h2 className="mt-4 text-title font-black leading-[var(--line-height-title)] sm:text-title-lg">
              Use the same CTA rhythm across the site.
            </h2>
            <p className="mt-5 max-w-2xl text-body leading-7 text-canvas/75">
              A dark operational panel with one clear primary action and one
              low-pressure secondary path.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <ButtonLink
              href="mailto:hello@northline.ai?subject=Northline%20preview"
              icon={ArrowRight}
              className="bg-canvas text-ink hover:bg-teal-soft"
            >
              Request preview
            </ButtonLink>
            <ButtonLink href="/" tone="ghost" className="text-canvas hover:bg-white/10">
              Back home
            </ButtonLink>
          </div>
        </div>
      </section>

      <SiteFooter copy={copy} />
    </main>
  );
}
