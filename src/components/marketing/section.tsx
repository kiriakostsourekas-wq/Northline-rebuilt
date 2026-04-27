import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";

type SectionTone = "canvas" | "raised" | "subtle" | "dark";

type SectionProps = {
  id?: string;
  children: ReactNode;
  tone?: SectionTone;
  tight?: boolean;
  className?: string;
  innerClassName?: string;
  "aria-label"?: string;
};

const toneClassNames: Record<SectionTone, string> = {
  canvas: "bg-canvas text-ink",
  raised: "border-y border-border bg-raised text-ink",
  subtle: "border-y border-border bg-subtle text-ink",
  dark: "bg-ink text-canvas",
};

export function Section({
  id,
  children,
  tone = "canvas",
  tight = false,
  className,
  innerClassName,
  "aria-label": ariaLabel,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={cn(toneClassNames[tone], className)}
    >
      <div
        className={cn(
          "mx-auto max-w-7xl px-[var(--space-page)]",
          tight ? "py-[var(--space-section-tight)]" : "py-[var(--space-section)]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </section>
  );
}

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  body?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="mt-4 text-title font-black leading-[var(--line-height-title)] text-balance sm:text-title-lg">
        {title}
      </h2>
      {body ? (
        <p className="mt-5 text-body-lg leading-[var(--line-height-copy)] text-muted">
          {body}
        </p>
      ) : null}
    </div>
  );
}
