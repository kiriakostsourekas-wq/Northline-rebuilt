import type { LucideIcon } from "lucide-react";
import { MarketingCard } from "@/components/marketing/card";
import { cn } from "@/lib/utils";

type FeatureBlockProps = {
  title: string;
  body: string;
  icon: LucideIcon;
  accent?: "teal" | "blue" | "amber" | "rose" | "violet";
  className?: string;
};

const accentClassNames = {
  teal: "bg-teal-soft text-teal-strong",
  blue: "bg-blue-soft text-blue",
  amber: "bg-amber-soft text-amber",
  rose: "bg-rose-soft text-rose",
  violet: "bg-violet-soft text-violet",
};

export function FeatureBlock({
  title,
  body,
  icon: Icon,
  accent = "teal",
  className,
}: FeatureBlockProps) {
  return (
    <MarketingCard interactive className={cn("shadow-none", className)}>
      <span
        className={cn(
          "grid size-11 place-items-center rounded-md",
          accentClassNames[accent],
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-5 text-title-sm font-black leading-tight">{title}</h3>
      <p className="mt-3 text-body-sm leading-6 text-muted">{body}</p>
    </MarketingCard>
  );
}
