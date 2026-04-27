import Link from "next/link";
import { saveKnowledgeItemAction } from "@/app/app/knowledge/actions";
import { getSectionConfig } from "@/lib/knowledge/sections";
import type { BusinessContextSectionValue } from "@/lib/knowledge/types";
import type { KnowledgeEditorItem } from "@/server/knowledge/queries";

export function KnowledgeEditor({
  section,
  item,
  canManage,
}: {
  section: BusinessContextSectionValue;
  item: KnowledgeEditorItem | null;
  canManage: boolean;
}) {
  const config = getSectionConfig(section);
  const structuredData = item?.structuredData ?? {};

  return (
    <form action={saveKnowledgeItemAction} className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <input type="hidden" name="section" value={section} />
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-title-sm font-black">
            {item ? "Edit knowledge" : "Add knowledge"}
          </h2>
          <p className="mt-2 text-body-sm leading-6 text-muted">
            {config.description}
          </p>
          {!canManage ? (
            <p className="mt-2 text-caption font-bold text-amber">
              Owner or admin access is required to edit this knowledge.
            </p>
          ) : null}
        </div>
        {item ? (
          <Link
            href={`/app/knowledge?section=${section}`}
            className="rounded-md border border-border bg-canvas px-3 py-2 text-caption font-black text-muted hover:text-ink"
          >
            New item
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-body-sm font-bold text-ink">
          Title
          <input
            name="title"
            required
            disabled={!canManage}
            defaultValue={item?.title ?? ""}
            placeholder={config.label}
            className="min-h-11 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none focus:border-teal disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
          />
        </label>
        <label className="grid gap-2 text-body-sm font-bold text-ink">
          Language
          <select
            name="locale"
            disabled={!canManage}
            defaultValue={item?.locale ?? "MIXED"}
            className="min-h-11 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none focus:border-teal disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
          >
            <option value="MIXED">Mixed / applies to both</option>
            <option value="EN">English</option>
            <option value="EL">Greek</option>
          </select>
        </label>

        {config.fields.map((field) => (
          <label
            key={field.key}
            className="grid gap-2 text-body-sm font-bold text-ink"
          >
            {field.label}
            {field.multiline ? (
              <textarea
                name={field.key}
                rows={field.key === "note" ? 6 : 4}
                required={field.required}
                disabled={!canManage}
                defaultValue={stringValue(structuredData[field.key])}
                placeholder={field.placeholder}
                className="resize-y rounded-md border border-border bg-canvas px-3 py-3 text-body-sm text-ink outline-none focus:border-teal disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
              />
            ) : (
              <input
                name={field.key}
                required={field.required}
                disabled={!canManage}
                defaultValue={stringValue(structuredData[field.key])}
                placeholder={field.placeholder}
                className="min-h-11 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none focus:border-teal disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
              />
            )}
          </label>
        ))}
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          name="status"
          value="DRAFT"
          disabled={!canManage}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-canvas px-5 py-3 text-body-sm font-black text-ink disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
        >
          Save draft
        </button>
        <button
          name="status"
          value="PUBLISHED"
          disabled={!canManage}
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal px-5 py-3 text-body-sm font-black text-white shadow-card transition-colors hover:bg-teal-strong disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted disabled:shadow-none"
        >
          Publish
        </button>
      </div>
    </form>
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
