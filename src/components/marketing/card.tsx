import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardTone = "raised" | "subtle" | "dark";

type MarketingCardProps = {
  children: ReactNode;
  tone?: CardTone;
  interactive?: boolean;
  className?: string;
};

const toneClassNames: Record<CardTone, string> = {
  raised: "border-border bg-raised text-ink",
  subtle: "border-border bg-subtle text-ink",
  dark: "border-white/10 bg-ink text-canvas",
};

export function MarketingCard({
  children,
  tone = "raised",
  interactive = false,
  className,
}: MarketingCardProps) {
  return (
    <div
      className={cn(
        "rounded-md border p-6 shadow-card",
        toneClassNames[tone],
        interactive &&
          "transition-transform duration-200 ease-[var(--motion-ease)] hover:-translate-y-0.5 hover:shadow-soft",
        className,
      )}
    >
      {children}
    </div>
  );
}
