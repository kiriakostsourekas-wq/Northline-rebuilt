import type { LucideIcon } from "lucide-react";
import { ArrowRight, Languages } from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { MarketingCard } from "@/components/marketing/card";
import { PageHero } from "@/components/marketing/page-hero";
import { Section, SectionHeader } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";
import { ButtonLink } from "@/components/ui/button-link";

type RouteHero = {
  eyebrow: string;
  title: string;
  body: string;
};

type LanguagePanel = {
  label: string;
  eyebrow: string;
  title: string;
  body: string;
  points?: readonly string[];
};

type RouteCard = {
  title: string;
  body: string;
  icon: LucideIcon;
  secondaryTitle?: string;
  secondaryBody?: string;
};

type RouteCta = {
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
};

type PublicRoutePageProps = {
  hero: RouteHero;
  languageNote: string;
  languagePanels: readonly LanguagePanel[];
  cardsEyebrow: string;
  cardsTitle: string;
  cardsBody?: string;
  cards: readonly RouteCard[];
  cta: RouteCta;
};

export function PublicRoutePage({
  hero,
  languageNote,
  languagePanels,
  cardsEyebrow,
  cardsTitle,
  cardsBody,
  cards,
  cta,
}: PublicRoutePageProps) {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WebsiteHeader />
      <PageHero eyebrow={hero.eyebrow} title={hero.title} body={hero.body}>
        <div className="rounded-lg border border-border bg-raised p-6 shadow-card">
          <Badge tone="blue">EN + EL</Badge>
          <div className="mt-5 flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-blue-soft text-blue">
              <Languages aria-hidden="true" className="size-5" />
            </span>
            <p className="text-body-sm leading-6 text-muted">{languageNote}</p>
          </div>
        </div>
      </PageHero>

      <Section>
        <div className="grid gap-4 lg:grid-cols-2">
          {languagePanels.map((panel, index) => (
            <article
              key={panel.label}
              className="rounded-md border border-border bg-raised p-6 shadow-card"
            >
              <Badge tone={index === 0 ? "teal" : "blue"}>
                {panel.label}
              </Badge>
              <p className="mt-5 text-caption font-black uppercase text-muted">
                {panel.eyebrow}
              </p>
              <h2 className="mt-3 text-title font-black leading-[var(--line-height-title)]">
                {panel.title}
              </h2>
              <p className="mt-4 text-body-sm leading-6 text-muted">
                {panel.body}
              </p>
              {panel.points?.length ? (
                <ul className="mt-6 grid gap-2 text-body-sm font-bold text-ink">
                  {panel.points.map((point) => (
                    <li key={point} className="flex gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-teal"
                      />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </Section>

      <Section tone="raised">
        <SectionHeader
          eyebrow={cardsEyebrow}
          title={cardsTitle}
          body={cardsBody}
          align="center"
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <MarketingCard key={card.title} className="h-full">
                <span className="grid size-10 place-items-center rounded-md bg-teal-soft text-teal-strong">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <h3 className="mt-5 text-title-sm font-black">
                  {card.title}
                </h3>
                <p className="mt-3 text-body-sm leading-6 text-muted">
                  {card.body}
                </p>
                {card.secondaryTitle || card.secondaryBody ? (
                  <div className="mt-5 border-t border-border pt-4">
                    {card.secondaryTitle ? (
                      <p className="text-body-sm font-black">
                        {card.secondaryTitle}
                      </p>
                    ) : null}
                    {card.secondaryBody ? (
                      <p className="mt-2 text-caption leading-5 text-muted">
                        {card.secondaryBody}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </MarketingCard>
            );
          })}
        </div>
      </Section>

      <Section>
        <div className="grid gap-8 rounded-lg border border-border bg-ink p-6 text-canvas shadow-soft sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-caption font-black uppercase text-teal-soft">
              {cta.eyebrow}
            </p>
            <h2 className="mt-4 max-w-3xl text-title font-black leading-[var(--line-height-title)] sm:text-title-lg">
              {cta.title}
            </h2>
            <p className="mt-5 max-w-2xl text-body leading-7 text-canvas/75">
              {cta.body}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <ButtonLink href={cta.primaryHref} icon={ArrowRight} size="lg">
              {cta.primaryLabel}
            </ButtonLink>
            {cta.secondaryHref && cta.secondaryLabel ? (
              <ButtonLink
                href={cta.secondaryHref}
                tone="ghost"
                size="lg"
                className="border border-white/15 text-canvas hover:bg-white/10"
              >
                {cta.secondaryLabel}
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </Section>
      <WebsiteFooter />
    </main>
  );
}
