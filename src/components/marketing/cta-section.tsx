import { ArrowRight, BarChart3 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";

type CtaSectionProps = {
  id?: string;
  eyebrow: string;
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export function CtaSection({
  id = "contact",
  eyebrow,
  title,
  body,
  primaryLabel,
  secondaryLabel,
}: CtaSectionProps) {
  return (
    <section id={id} className="bg-canvas px-[var(--space-page)] py-[var(--space-section)]">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-lg border border-border bg-ink p-6 text-canvas shadow-soft sm:p-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="text-caption font-black uppercase text-teal-soft">
            {eyebrow}
          </p>
          <h2 className="mt-4 text-title font-black leading-[var(--line-height-title)] sm:text-title-lg">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-body leading-7 text-canvas/75">
            {body}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <ButtonLink
            href="mailto:hello@northline.ai?subject=Northline%20preview"
            icon={ArrowRight}
            className="bg-canvas text-ink hover:bg-teal-soft"
          >
            {primaryLabel}
          </ButtonLink>
          <ButtonLink
            href="#platform"
            tone="ghost"
            className="text-canvas hover:bg-white/10"
            icon={BarChart3}
          >
            {secondaryLabel}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
