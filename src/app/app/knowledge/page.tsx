import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, FileText, Sparkles } from "lucide-react";
import { createStarterKnowledgeAction } from "@/app/app/knowledge/actions";
import { ContextPreview } from "@/components/app/knowledge/context-preview";
import { KnowledgeEditor } from "@/components/app/knowledge/knowledge-editor";
import { KnowledgeItemCard } from "@/components/app/knowledge/item-card";
import { KnowledgeSectionNav } from "@/components/app/knowledge/section-nav";
import { SetupWarnings } from "@/components/app/knowledge/setup-warnings";
import { NoticeBanner } from "@/components/app/notice-banner";
import { Badge } from "@/components/marketing/badge";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import {
  getSectionConfig,
  isBusinessContextSection,
} from "@/lib/knowledge/sections";
import type { BusinessContextSectionValue } from "@/lib/knowledge/types";
import { getKnowledgeEditorData } from "@/server/knowledge/queries";

export const metadata: Metadata = {
  title: "Business knowledge",
  description:
    "Northline workspace business context for approved answers, qualification, booking, and handoff rules.",
};

export const dynamic = "force-dynamic";

type KnowledgePageProps = {
  searchParams?: Promise<{
    section?: string | string[];
    item?: string | string[];
    error?: string | string[];
    notice?: string | string[];
  }>;
};

export default async function KnowledgePage({
  searchParams,
}: KnowledgePageProps) {
  const query = (await searchParams) ?? {};
  const sectionParam = normalizeParam(query.section);
  const selectedSection = parseSection(sectionParam);
  const selectedItemId = normalizeParam(query.item);
  const error = normalizeParam(query.error);
  const notice = knowledgeNoticeMessage(normalizeParam(query.notice));
  const { organization, user } = await requireCompletedOnboarding();
  const canManageKnowledge = user.role === "OWNER" || user.role === "ADMIN";
  const data = await getKnowledgeEditorData({
    organizationId: organization.id,
    selectedSection,
    selectedItemId,
  });
  const editorSection = data.selectedItem?.section ?? data.selectedSection;
  const sectionConfig = getSectionConfig(editorSection);
  const sectionItems = data.items.filter(
    (item) => item.section === editorSection,
  );
  const publishedCount = data.items.filter(
    (item) => item.status === "PUBLISHED",
  ).length;
  const draftCount = data.items.filter(
    (item) => item.status === "DRAFT",
  ).length;
  const isEmpty = data.items.length === 0;

  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
          <div>
            <Badge tone="teal">Business knowledge</Badge>
            <h1 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              Approved context for every lead conversation
            </h1>
            <p className="mt-3 max-w-3xl text-body-sm leading-6 text-muted">
              Define services, FAQs, rules, languages, locations, booking
              policies, and escalation paths as structured workspace data before
              the assistant uses them.
            </p>
          </div>
          <div className="grid gap-3 rounded-md border border-border bg-canvas p-4">
            <MetricRow label="Published entries" value={publishedCount} />
            <MetricRow label="Draft entries" value={draftCount} />
            <MetricRow
              label="Setup warnings"
              value={data.contextBundle.warnings.length}
            />
          </div>
        </div>
      </section>

      {error ? (
        <NoticeBanner tone="error">{error}</NoticeBanner>
      ) : null}
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}

      <SetupWarnings warnings={data.contextBundle.warnings} />

      <section className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="grid h-fit gap-4 xl:sticky xl:top-24">
          <div className="rounded-lg border border-border bg-raised p-3 shadow-card">
            <KnowledgeSectionNav
              activeSection={editorSection}
              items={data.items}
            />
          </div>

          <div className="rounded-lg border border-border bg-raised p-5 shadow-card">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-slate-soft text-slate">
                <Sparkles aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2 className="text-body font-black">Starter examples</h2>
                <p className="mt-1 text-caption font-bold leading-5 text-muted">
                  Seed the empty workspace with editable draft examples.
                </p>
              </div>
            </div>
            <form action={createStarterKnowledgeAction} className="mt-4">
              <button
                disabled={!isEmpty || !canManageKnowledge}
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md bg-ink px-4 py-2 text-caption font-black text-white transition-colors hover:bg-slate disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted"
              >
                Add examples
              </button>
            </form>
          </div>
        </aside>

        <div className="grid min-w-0 gap-6">
          <section className="rounded-lg border border-border bg-canvas p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-md bg-teal-soft text-teal-strong">
                    <BookOpenText aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-title-sm font-black">
                      {sectionConfig.label}
                    </h2>
                    <p className="mt-1 text-body-sm leading-6 text-muted">
                      {sectionConfig.description}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href={`/app/knowledge?section=${editorSection}`}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-raised px-4 py-2 text-caption font-black text-ink transition-colors hover:border-teal/35"
              >
                New {sectionConfig.shortLabel.toLowerCase()} item
              </Link>
            </div>
          </section>

          <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <KnowledgeEditor
              section={editorSection}
              item={data.selectedItem}
              canManage={canManageKnowledge}
            />

            <div className="grid h-fit gap-3">
              {sectionItems.length > 0 ? (
                sectionItems.map((item) => (
                  <KnowledgeItemCard
                    key={item.id}
                    item={item}
                    active={item.id === data.selectedItem?.id}
                    canManage={canManageKnowledge}
                  />
                ))
              ) : (
                <EmptySectionState sectionLabel={sectionConfig.label} />
              )}
            </div>
          </section>

          <ContextPreview bundle={data.contextBundle} />
        </div>
      </section>
    </main>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-body-sm">
      <span className="font-bold text-muted">{label}</span>
      <span className="font-mono text-body font-black text-ink">{value}</span>
    </div>
  );
}

function EmptySectionState({ sectionLabel }: { sectionLabel: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-raised p-6 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-md bg-subtle text-muted">
        <FileText aria-hidden="true" className="size-5" />
      </span>
      <h3 className="mt-4 text-body font-black">
        No {sectionLabel.toLowerCase()}
      </h3>
      <p className="mt-2 text-body-sm leading-6 text-muted">
        Add the first approved entry for this section.
      </p>
    </div>
  );
}

function parseSection(
  value?: string,
): BusinessContextSectionValue | undefined {
  if (!value) return undefined;
  return isBusinessContextSection(value) ? value : "BUSINESS_PROFILE";
}

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function knowledgeNoticeMessage(value?: string) {
  const messages: Record<string, string> = {
    "item-created": "Knowledge entry created.",
    "item-saved": "Knowledge entry saved.",
    "item-published": "Knowledge entry published for assistant context.",
    "item-archived": "Knowledge entry archived.",
    "starter-examples-added": "Starter examples added as editable entries.",
  };
  return value ? messages[value] : undefined;
}
