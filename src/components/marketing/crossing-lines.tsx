import { cn } from "@/lib/utils";

type CrossingLinesProps = {
  className?: string;
  fade?: "hero" | "section";
};

export function CrossingLines({ className, fade = "section" }: CrossingLinesProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(var(--color-ink)_1px,transparent_1px),linear-gradient(90deg,var(--color-ink)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute left-[-18%] top-[18%] h-px w-[82%] origin-left rotate-[16deg] bg-border-strong/60" />
      <div className="absolute right-[-20%] top-[24%] h-px w-[80%] origin-right -rotate-[14deg] bg-border-strong/55" />
      <div className="absolute bottom-[18%] left-[20%] h-px w-[58%] origin-left -rotate-[9deg] bg-teal/20" />
      <div
        className={cn(
          "absolute inset-0",
          fade === "hero"
            ? "bg-[linear-gradient(90deg,var(--color-canvas)_0%,transparent_18%,transparent_74%,var(--color-canvas)_100%),linear-gradient(180deg,transparent_0%,var(--color-canvas)_92%)]"
            : "bg-[linear-gradient(180deg,var(--color-canvas)_0%,transparent_24%,transparent_70%,var(--color-canvas)_100%)]",
        )}
      />
    </div>
  );
}
