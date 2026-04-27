import Link from "next/link";
import { sectionConfigs } from "@/lib/knowledge/sections";
import type { BusinessContextRecord } from "@/lib/knowledge/types";

export function KnowledgeSectionNav({
  activeSection,
  items,
}: {
  activeSection: string;
  items: BusinessContextRecord[];
}) {
  return (
    <nav aria-label="Knowledge sections" className="grid gap-1">
      {sectionConfigs.map((section) => {
        const count = items.filter(
          (item) =>
            item.section === section.section && item.status === "PUBLISHED",
        ).length;

        return (
          <Link
            key={section.section}
            href={`/app/knowledge?section=${section.section}`}
            className={`rounded-md px-3 py-2 text-body-sm font-bold transition-colors ${
              activeSection === section.section
                ? "bg-teal-soft text-teal-strong"
                : "text-muted hover:bg-subtle hover:text-ink"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span>{section.shortLabel}</span>
              <span className="font-mono text-caption">{count}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
