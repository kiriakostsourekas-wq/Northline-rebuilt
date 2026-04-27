import Link from "next/link";
import { BrandMark } from "@/components/marketing/brand-mark";
import { siteConfig } from "@/content/website";

export function WebsiteFooter() {
  return (
    <footer className="border-t border-border bg-raised">
      <div className="mx-auto grid max-w-7xl gap-10 px-[var(--space-page)] py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xl text-body-sm leading-6 text-muted">
            {siteConfig.footer.note}
          </p>
          <p className="mt-5 font-mono text-caption font-bold uppercase text-muted">
            Preview deployments only
          </p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {siteConfig.footer.groups.map((group) => (
            <nav key={group.title} aria-label={`${group.title} footer links`}>
              <h2 className="text-caption font-black uppercase text-ink">
                {group.title}
              </h2>
              <div className="mt-4 grid gap-3 text-body-sm font-bold text-muted">
                {group.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="hover:text-ink"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
}
