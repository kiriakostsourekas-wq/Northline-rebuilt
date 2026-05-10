import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CalendarCheck,
  CalendarX2,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  DatabaseZap,
  Handshake,
  Inbox,
  Languages,
  MessageCircle,
  MessagesSquare,
  MonitorSmartphone,
  PhoneCall,
  Route,
  Send,
} from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { CrossingLines } from "@/components/marketing/crossing-lines";
import { ProductVisual } from "@/components/marketing/product-visual";
import { Section, SectionHeader } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";
import { ButtonLink } from "@/components/ui/button-link";
import { marketingEvents } from "@/lib/marketing-events";
import { cta, homePage } from "@/content/website";
import type { Locale } from "@/content/marketing";

const proofIcons: LucideIcon[] = [
  Languages,
  MessagesSquare,
  Handshake,
  DatabaseZap,
];

const problemIcons: LucideIcon[] = [Clock3, ClipboardList, Send, CalendarX2];
const workflowIcons: LucideIcon[] = [
  Inbox,
  MessageCircle,
  ClipboardList,
  CalendarCheck,
];
const channelIcons: LucideIcon[] = [
  MonitorSmartphone,
  PhoneCall,
  Camera,
  MessagesSquare,
];

type MarketingPageProps = {
  locale?: Locale;
};

export function MarketingPage({ locale = "en" }: MarketingPageProps) {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WebsiteHeader />

      <section className="relative isolate overflow-hidden border-b border-border bg-canvas">
        <CrossingLines fade="hero" className="-z-10" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-28 border-t border-border bg-gradient-to-b from-transparent to-subtle/75" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-[var(--space-page)] py-14 sm:py-16 lg:min-h-[760px] lg:grid-cols-[0.94fr_1.06fr] lg:py-20">
          <div className="min-w-0">
            <Badge
              tone="teal"
              className="max-w-full whitespace-normal text-left leading-5"
            >
              {homePage.hero.eyebrow}
            </Badge>
            <h1 className="mt-7 max-w-4xl text-title-lg font-black leading-[0.98] text-balance sm:text-display lg:text-display-xl">
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
                className="w-full sm:w-auto"
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel={cta.requestDemo}
                analyticsLocation="home_hero"
              >
                {cta.requestDemo}
              </ButtonLink>
              <ButtonLink
                href="/#how-it-works"
                tone="secondary"
                icon={Route}
                size="lg"
                className="w-full sm:w-auto"
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel={cta.seeWorkflow}
                analyticsLocation="home_hero"
              >
                See how it works
              </ButtonLink>
            </div>
          </div>

          <ProductVisual locale={locale} />
        </div>
      </section>

      <section
        aria-label="Northline proof points"
        className="border-b border-border bg-canvas"
      >
        <div className="mx-auto max-w-7xl px-[var(--space-page)] py-6">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {homePage.proof.items.map((item, index) => {
              const Icon = proofIcons[index] ?? CheckCircle2;

              return (
                <article key={item.title} className="bg-raised p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-teal-soft text-teal-strong">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                    <div>
                      <h2 className="text-body-sm font-black">{item.title}</h2>
                      <p className="mt-1 text-caption leading-5 text-muted">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <Section id="product" tone="raised">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <SectionHeader
            eyebrow={homePage.problem.eyebrow}
            title={homePage.problem.title}
            body={homePage.problem.body}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {homePage.problem.items.map((item, index) => {
              const Icon = problemIcons[index] ?? CheckCircle2;

              return (
                <article
                  key={item.title}
                  className="rounded-md border border-border bg-canvas p-6 shadow-card"
                >
                  <span className="grid size-10 place-items-center rounded-md bg-slate-soft text-slate">
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

      <Section
        id="channels"
        tone="subtle"
        className="relative isolate overflow-hidden"
        innerClassName="relative"
      >
        <CrossingLines className="-z-10 opacity-70" />
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <SectionHeader
            eyebrow={homePage.channels.eyebrow}
            title={homePage.channels.title}
            body={homePage.channels.body}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {homePage.channels.items.map((channel, index) => {
              const Icon = channelIcons[index] ?? MessageCircle;

              return (
                <article
                  key={channel.title}
                  className="rounded-md border border-border bg-raised p-5 shadow-card"
                >
                  <span className="grid size-10 place-items-center rounded-md bg-blue-soft text-blue">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <h3 className="mt-5 text-body font-black">{channel.title}</h3>
                  <p className="mt-2 text-body-sm leading-6 text-muted">
                    {channel.body}
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
                href="/#channels"
                tone="ghost"
                size="lg"
                className="w-full border border-white/15 text-canvas hover:bg-white/10 sm:w-auto"
                icon={MessagesSquare}
                analyticsEvent={marketingEvents.ctaClick}
                analyticsLabel="See supported channels"
                analyticsLocation="home_final_cta"
              >
                See supported channels
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <WebsiteFooter />
    </main>
  );
}
