import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "teal" | "blue" | "amber" | "rose" | "violet";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

const toneClassNames: Record<BadgeTone, string> = {
  neutral: "border-border bg-raised text-muted-strong",
  teal: "border-teal/25 bg-teal-soft text-teal-strong",
  blue: "border-blue/20 bg-blue-soft text-blue",
  amber: "border-amber/25 bg-amber-soft text-amber",
  rose: "border-rose/20 bg-rose-soft text-rose",
  violet: "border-violet/20 bg-violet-soft text-violet",
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-sm border px-2.5 py-1 text-caption font-black uppercase",
        toneClassNames[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
