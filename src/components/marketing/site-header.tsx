import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandMark } from "@/components/marketing/brand-mark";
import { ButtonLink } from "@/components/ui/button-link";
import type { Locale, MarketingCopy } from "@/content/marketing";

type SiteHeaderProps = {
  locale: Locale;
  copy: MarketingCopy;
};

export function SiteHeader({ locale, copy }: SiteHeaderProps) {
  const homeHref = locale === "el" ? "/el" : "/";
  const links = [
    { href: "#platform", label: copy.nav.platform },
    { href: "#workflow", label: copy.nav.workflow },
    { href: "#pricing", label: copy.nav.pricing },
    { href: "#security", label: copy.nav.security },
    { href: "#faq", label: copy.nav.faq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-canvas/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-[var(--space-page)] py-4">
        <BrandMark href={homeHref} />
        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-6 text-body-sm font-bold text-muted lg:flex"
        >
          {links.map((link) => (
            <a key={link.href} className="hover:text-ink" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href={copy.alternateHref}
            className="grid min-h-9 place-items-center rounded-md border border-border bg-raised px-3 text-caption font-black text-ink transition-colors hover:border-teal/45"
            aria-label={`Switch language from ${copy.languageLabel}`}
          >
            {copy.alternateLabel}
          </Link>
          <ButtonLink
            href="#contact"
            icon={ArrowRight}
            size="sm"
            className="hidden sm:inline-flex"
          >
            {copy.cta.primary}
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
