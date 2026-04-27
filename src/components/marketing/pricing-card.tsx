import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { MarketingCard } from "@/components/marketing/card";
import { ButtonLink } from "@/components/ui/button-link";
import { marketingEvents } from "@/lib/marketing-events";
import { cn } from "@/lib/utils";

type PricingCardProps = {
  name: string;
  price: string;
  description: string;
  features: readonly string[];
  featured?: boolean;
  ctaLabel: string;
  ctaHref?: string;
  analyticsLocation?: string;
};

export function PricingCard({
  name,
  price,
  description,
  features,
  featured = false,
  ctaLabel,
  ctaHref = "#contact",
  analyticsLocation = "pricing_card",
}: PricingCardProps) {
  return (
    <MarketingCard
      tone={featured ? "dark" : "raised"}
      className={cn("flex h-full flex-col shadow-none", featured && "shadow-soft")}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-title-sm font-black">{name}</h3>
          <p
            className={cn(
              "mt-2 text-caption font-bold uppercase",
              featured ? "text-canvas/70" : "text-muted",
            )}
          >
            {description}
          </p>
        </div>
        {featured ? <Badge tone="teal">Focused</Badge> : null}
      </div>
      <p className="mt-7 text-title font-black">{price}</p>
      <ul className="mt-7 grid gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-body-sm leading-6">
            <CheckCircle2
              aria-hidden="true"
              className={cn(
                "mt-1 size-4 shrink-0",
                featured ? "text-teal-soft" : "text-teal",
              )}
            />
            <span className={featured ? "text-canvas/80" : "text-muted"}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
      <ButtonLink
        href={ctaHref}
        tone={featured ? "primary" : "secondary"}
        className="mt-8 w-full"
        analyticsEvent={marketingEvents.ctaClick}
        analyticsLabel={`${name}: ${ctaLabel}`}
        analyticsLocation={analyticsLocation}
      >
        {ctaLabel}
      </ButtonLink>
    </MarketingCard>
  );
}
