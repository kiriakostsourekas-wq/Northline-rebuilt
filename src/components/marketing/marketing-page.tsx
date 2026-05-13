import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  ClipboardList,
  Hotel,
  MessageCircle,
  MessagesSquare,
  Route,
  Send,
  ShieldCheck,
  Stethoscope,
  Store,
} from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { CrossingLines } from "@/components/marketing/crossing-lines";
import {
  LeadWorkflowDemo,
  TrustStrip,
} from "@/components/marketing/lead-workflow-demo";
import { PainpointCalculator } from "@/components/marketing/painpoint-calculator";
import { ProductDemoStage } from "@/components/marketing/product-demo-stage";
import { Section, SectionHeader } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";
import { ButtonLink } from "@/components/ui/button-link";
import { cta, homePage } from "@/content/website";
import type { Locale } from "@/content/marketing";
import { marketingEvents } from "@/lib/marketing-events";

const painIcons: LucideIcon[] = [Clock3, MessageCircle, MessagesSquare, Route];
const workflowIcons: LucideIcon[] = [
  MessagesSquare,
  ClipboardList,
  CalendarCheck,
  Send,
];
const industryIcons: LucideIcon[] = [Stethoscope, Building2, Store, Hotel];
const heroBodyLines = homePage.hero.body
  .split(". ")
  .map((line) => (line.endsWith(".") ? line : `${line}.`));

type MarketingPageProps = {
  locale?: Locale;
};

export function MarketingPage({ locale = "en" }: MarketingPageProps) {
  return (
    <main className="min-h-screen bg-canvas text-ink" data-locale={locale}>
      <WebsiteHeader />

      <section className="relative isolate overflow-hidden border-b border-border bg-canvas">
        <CrossingLines fade="hero" className="-z-10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-32 border-t border-border bg-gradient-to-b from-transparent to-subtle/75" />
        <div className="mx-auto grid max-w-7xl gap-10 overflow-hidden px-[var(--space-page)] py-12 sm:py-16 lg:min-h-[760px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:py-20">
          <div className="min-w-0 max-w-full sm:w-auto">
            <Badge
              tone="teal"
              className="mobile-hero-measure whitespace-normal text-left leading-5 sm:w-auto sm:max-w-full"
            >
              {homePage.hero.eyebrow}
            </Badge>
            <h1 className="mobile-hero-measure mt-7 text-title font-black leading-[0.98] text-balance sm:w-auto sm:max-w-4xl sm:text-title-lg lg:text-display-xl">
              {homePage.hero.title}
            </h1>
            <p className="mobile-hero-measure mt-6 whitespace-normal break-words text-body leading-[var(--line-height-copy)] text-muted sm:w-auto sm:max-w-2xl sm:text-body-lg">
              {heroBodyLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink
                href="/contact?intent=demo"
                icon={ArrowRight}
                size="lg"
                className="w-full sm:w-auto"
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel={cta.requestDemo}
                analyticsLocation="home_hero"
              >
                {cta.requestDemo}
              </ButtonLink>
              <ButtonLink
                href="/#demo"
                tone="secondary"
                icon={Route}
                size="lg"
                className="w-full sm:w-auto"
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel="Watch workflow"
                analyticsLocation="home_hero"
              >
                Watch workflow
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-3 text-caption font-bold text-muted sm:grid-cols-3">
              <div className="rounded-md border border-border bg-raised/75 p-3">
                Preview workflow
              </div>
              <div className="rounded-md border border-border bg-raised/75 p-3">
                Synthetic demo data
              </div>
              <div className="rounded-md border border-border bg-raised/75 p-3">
                Greek + English
              </div>
            </div>
          </div>

          <div className="mobile-hero-measure min-w-0 sm:max-w-none">
            <ProductDemoStage
              title={homePage.demo.title}
              body={homePage.demo.body}
              posterAlt={homePage.demo.posterAlt}
            />
          </div>
        </div>
      </section>

      <Section id="demo" tone="raised" tight>
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <SectionHeader
            eyebrow={homePage.demo.eyebrow}
            title="The product story should be visible before the pitch."
            body="A visitor asks. Northline replies, qualifies, and prepares the next action while the lead is still warm."
          />
          <LeadWorkflowDemo />
        </div>
      </Section>

      <Section id="product">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <SectionHeader
              eyebrow={homePage.problem.eyebrow}
              title={homePage.problem.title}
              body={homePage.problem.body}
            />
            <div className="mt-8">
              <PainpointCalculator />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {homePage.problem.items.map((item, index) => {
              const Icon = painIcons[index] ?? CheckCircle2;

              return (
                <article
                  key={item.title}
                  className="rounded-md border border-border bg-raised p-6 shadow-card"
                >
                  <span className="grid size-10 place-items-center rounded-md bg-rose-soft text-rose">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-5 text-title-sm font-black leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-body-sm leading-6 text-muted">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </Section>

      <Section id="how-it-works" tone="subtle">
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
                <div className="flex items-center justify-between gap-4">
                  <span className="grid size-10 place-items-center rounded-md bg-teal-soft text-teal-strong">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="font-mono text-caption font-black text-muted">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-title-sm font-black">{step.title}</h3>
                <p className="mt-3 text-body-sm leading-6 text-muted">
                  {step.body}
                </p>
              </article>
            );
          })}
        </div>
      </Section>

      <Section aria-label="Northline trust points">
        <SectionHeader
          eyebrow="Trust"
          title="Credibility starts with being clear about what is real."
          body="The homepage should sell the workflow without pretending there are already public customer wins. The demo is preview-labeled, synthetic, and grounded in the product we are building."
          align="center"
        />
        <div className="mt-12">
          <TrustStrip />
        </div>
      </Section>

      <Section id="industries" tone="raised">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
          <SectionHeader
            eyebrow={homePage.industries.eyebrow}
            title={homePage.industries.title}
            body={homePage.industries.body}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {homePage.industries.items.map((item, index) => {
              const Icon = industryIcons[index] ?? Store;

              return (
                <article
                  key={item.title}
                  className="rounded-md border border-border bg-canvas p-6 shadow-card"
                >
                  <span className="grid size-10 place-items-center rounded-md bg-blue-soft text-blue">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-5 text-title-sm font-black leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-body-sm leading-6 text-muted">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </Section>

      <section className="relative isolate overflow-hidden border-t border-border bg-canvas px-[var(--space-page)] py-[var(--space-section)]">
        <CrossingLines className="-z-10 opacity-80" />
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 rounded-lg border border-border bg-ink p-6 text-canvas shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-caption font-black uppercase text-teal-soft">
                {homePage.finalCta.eyebrow}
              </p>
              <h2 className="mt-4 max-w-3xl text-title font-black leading-[var(--line-height-title)] sm:text-title-lg">
                {homePage.finalCta.title}
              </h2>
              <p className="mt-5 max-w-2xl text-body leading-7 text-canvas/75">
                {homePage.finalCta.body}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <ButtonLink
                href="/contact?intent=demo"
                icon={ArrowRight}
                size="lg"
                className="w-full sm:w-auto"
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel={cta.requestDemo}
                analyticsLocation="home_final_cta"
              >
                {cta.requestDemo}
              </ButtonLink>
              <ButtonLink
                href="/#demo"
                tone="ghost"
                size="lg"
                className="w-full border border-white/15 text-canvas hover:bg-white/10 sm:w-auto"
                icon={ShieldCheck}
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel="Review preview workflow"
                analyticsLocation="home_final_cta"
              >
                Review preview workflow
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </main>
  );
}
