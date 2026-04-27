import { Badge } from "@/components/marketing/badge";
import { Section } from "@/components/marketing/section";
import { WebsiteFooter } from "@/components/marketing/website-footer";
import { WebsiteHeader } from "@/components/marketing/website-header";

type LegalPageProps = {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: readonly {
    title: string;
    body: string;
  }[];
};

export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-canvas text-ink">
      <WebsiteHeader />
      <section className="border-b border-border bg-canvas">
        <div className="mx-auto max-w-4xl px-[var(--space-page)] py-16">
          <Badge tone="teal">{eyebrow}</Badge>
          <h1 className="mt-6 text-title-lg font-black leading-[var(--line-height-title)] text-balance sm:text-display">
            {title}
          </h1>
          <p className="mt-4 font-mono text-caption font-bold uppercase text-muted">
            Last updated: {updated}
          </p>
          <p className="mt-6 text-body-lg leading-[var(--line-height-copy)] text-muted">
            {intro}
          </p>
        </div>
      </section>
      <Section>
        <div className="mx-auto max-w-4xl rounded-lg border border-border bg-raised px-5 sm:px-8">
          {sections.map((section) => (
            <article
              key={section.title}
              className="border-t border-border py-7 first:border-t-0"
            >
              <h2 className="text-title-sm font-black">{section.title}</h2>
              <p className="mt-3 text-body-sm leading-7 text-muted">
                {section.body}
              </p>
            </article>
          ))}
        </div>
      </Section>
      <WebsiteFooter />
    </main>
  );
}
