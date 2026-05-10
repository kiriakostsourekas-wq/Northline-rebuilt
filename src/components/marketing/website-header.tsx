import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { ButtonLink } from "@/components/ui/button-link";
import { marketingEvents } from "@/lib/marketing-events";
import { siteConfig, cta } from "@/content/website";

export function WebsiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-[var(--space-page)] py-4">
        <BrandMark href="/" />
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 text-body-sm font-bold text-muted lg:flex"
        >
          {siteConfig.nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink
            href="/#product"
            tone="secondary"
            size="sm"
            className="hidden sm:inline-flex"
            analyticsEvent={marketingEvents.ctaClick}
            analyticsLabel={cta.seeProduct}
            analyticsLocation="header"
          >
            {cta.seeProduct}
          </ButtonLink>
          <ButtonLink
            href="/contact?intent=demo"
            icon={ArrowRight}
            size="sm"
            analyticsEvent={marketingEvents.ctaClick}
            analyticsLabel={cta.requestDemo}
            analyticsLocation="header"
          >
            {cta.requestDemo}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
