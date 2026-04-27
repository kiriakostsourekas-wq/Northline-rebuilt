import type { ReactNode } from "react";
import { Badge } from "@/components/marketing/badge";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  body: string;
  children?: ReactNode;
};

export function PageHero({ eyebrow, title, body, children }: PageHeroProps) {
  return (
    <section className="border-b border-border bg-canvas">
      <div className="mx-auto grid max-w-7xl gap-10 px-[var(--space-page)] py-16 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:py-20">
        <div>
          <Badge tone="teal">{eyebrow}</Badge>
          <h1 className="mt-6 max-w-4xl text-title-lg font-black leading-[var(--line-height-title)] text-balance sm:text-display">
            {title}
          </h1>
          <p className="mt-6 max-w-2xl text-body-lg leading-[var(--line-height-copy)] text-muted">
            {body}
          </p>
        </div>
        {children ? <div>{children}</div> : null}
      </div>
    </section>
  );
}
