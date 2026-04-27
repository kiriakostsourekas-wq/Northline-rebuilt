import Link from "next/link";
import {
  archiveKnowledgeItemAction,
  publishKnowledgeItemAction,
} from "@/app/app/knowledge/actions";
import type { KnowledgeEditorItem } from "@/server/knowledge/queries";

export function KnowledgeItemCard({
  item,
  active,
  canManage,
}: {
  item: KnowledgeEditorItem;
  active: boolean;
  canManage: boolean;
}) {
  return (
    <article
      className={`rounded-lg border p-4 ${
        active ? "border-teal/45 bg-teal-soft" : "border-border bg-raised"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-subtle px-2 py-1 text-caption font-black uppercase text-muted">
              {item.status.toLowerCase()}
            </span>
            <span className="rounded-md bg-canvas px-2 py-1 text-caption font-black uppercase text-muted">
              {item.locale ?? "mixed"}
            </span>
            {item.revisionCount > 0 ? (
              <span className="rounded-md bg-canvas px-2 py-1 text-caption font-black uppercase text-muted">
                {item.revisionCount} revisions
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-body font-black text-ink">{item.title}</h3>
          <p className="mt-2 line-clamp-3 text-body-sm leading-6 text-muted">
            {item.normalizedText}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/app/knowledge?section=${item.section}&item=${item.id}`}
            className="rounded-md border border-border bg-canvas px-3 py-2 text-caption font-black text-ink transition-colors hover:border-teal/35"
          >
            {canManage ? "Edit" : "View"}
          </Link>
          {canManage && item.status !== "PUBLISHED" ? (
            <form action={publishKnowledgeItemAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <button className="rounded-md bg-teal px-3 py-2 text-caption font-black text-white">
                Publish
              </button>
            </form>
          ) : null}
          {canManage ? (
            <form action={archiveKnowledgeItemAction}>
              <input type="hidden" name="itemId" value={item.id} />
              <button className="rounded-md border border-border bg-canvas px-3 py-2 text-caption font-black text-muted transition-colors hover:border-rose/35 hover:text-rose">
                Archive
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </article>
  );
}
