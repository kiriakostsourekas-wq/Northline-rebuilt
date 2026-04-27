import { BrandMark } from "@/components/marketing/brand-mark";
import type { MarketingCopy } from "@/content/marketing";

type SiteFooterProps = {
  copy: MarketingCopy;
};

export function SiteFooter({ copy }: SiteFooterProps) {
  const links = [
    { href: "#platform", label: copy.nav.platform },
    { href: "#workflow", label: copy.nav.workflow },
    { href: "#pricing", label: copy.nav.pricing },
    { href: "/style-guide", label: copy.footer.styleGuide },
  ];

  return (
    <footer className="border-t border-border bg-raised">
      <div className="mx-auto grid max-w-7xl gap-8 px-[var(--space-page)] py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xl text-body-sm leading-6 text-muted">
            {copy.footer.note}
          </p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="grid gap-3 text-body-sm font-bold text-muted sm:grid-flow-col sm:gap-5"
        >
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
