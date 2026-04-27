import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export function BrandMark({
  href = "/",
  compact = false,
  className,
}: BrandMarkProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-md bg-ink text-sm font-black text-canvas">
        <span className="absolute inset-x-2 top-1/2 h-px bg-teal-soft" />
        <span className="relative">N</span>
      </span>
      {!compact ? <span className="text-body-sm font-black">Northline</span> : null}
    </span>
  );

  return (
    <Link href={href} aria-label="Northline home">
      {content}
    </Link>
  );
}
