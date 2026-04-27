import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/marketing/badge";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import { getDataSubjectExportPreview } from "@/server/privacy/data-subject";
import { anonymizeLeadAction } from "@/app/app/privacy/actions";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Northline privacy and data subject request controls.",
};

export const dynamic = "force-dynamic";

type PrivacyPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    deleted?: string | string[];
  }>;
};

export default async function PrivacyPage({ searchParams }: PrivacyPageProps) {
  const query = (await searchParams) ?? {};
  const selector = normalizeParam(query.q) ?? "";
  const deleted = normalizeParam(query.deleted) === "1";
  const { organization, user } = await requireCompletedOnboarding();
  const canManage = user.role === "OWNER" || user.role === "ADMIN";
  const preview =
    selector && canManage
      ? await getDataSubjectExportPreview({
          organizationId: organization.id,
          selector,
        })
      : null;

  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <Badge tone="teal">Privacy controls</Badge>
            <h1 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              Data access and deletion scaffolding
            </h1>
            <p className="mt-3 max-w-2xl text-body-sm leading-6 text-muted">
              Look up a lead by email or phone, review the data export bundle,
              and anonymize lead-linked records when a verified data subject
              request is approved.
            </p>
          </div>
          <div className="rounded-md border border-border bg-canvas p-4">
            <ShieldCheck aria-hidden="true" className="size-6 text-teal-strong" />
            <p className="mt-3 text-body-sm font-black text-ink">
              Owner/admin only
            </p>
            <p className="mt-2 text-caption leading-5 text-muted">
              Verify request identity and retention obligations before using
              deletion. This is an engineering control, not a legal decision.
            </p>
          </div>
        </div>
      </section>

      {deleted ? (
        <p className="rounded-lg border border-teal/25 bg-teal-soft p-4 text-body-sm font-bold text-teal-strong">
          Lead-linked personal data was anonymized and audited.
        </p>
      ) : null}

      {!canManage ? (
        <section className="rounded-lg border border-border bg-raised p-6 text-body-sm leading-6 text-muted shadow-card">
          Only workspace owners and admins can manage data subject requests.
        </section>
      ) : (
        <>
          <form className="rounded-lg border border-border bg-raised p-5 shadow-card">
            <label className="grid gap-2 text-body-sm font-black text-ink">
              Data subject email or phone
              <input
                name="q"
                defaultValue={selector}
                placeholder="lead@example.com or +30..."
                className="min-h-11 rounded-md border border-border bg-canvas px-3 text-body-sm font-medium text-ink outline-none focus:border-teal"
              />
            </label>
            <button className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-3 text-body-sm font-black text-white">
              Look up data
            </button>
          </form>

          <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
            <h2 className="text-title-sm font-black">Export preview</h2>
            {!preview ? (
              <p className="mt-3 text-body-sm leading-6 text-muted">
                Enter a verified email or phone number to build a data export
                preview from lead, conversation, booking, handoff, and export
                records.
              </p>
            ) : !preview.ok ? (
              <p className="mt-3 rounded-md border border-rose/25 bg-rose-soft p-3 text-body-sm font-bold text-rose">
                {preview.error}
              </p>
            ) : preview.leads.length === 0 ? (
              <p className="mt-3 text-body-sm leading-6 text-muted">
                No matching lead records were found in this workspace.
              </p>
            ) : (
              <div className="mt-4 grid gap-4">
                <div className="overflow-x-auto rounded-md border border-border bg-canvas">
                  <pre className="max-h-[520px] min-w-[720px] overflow-auto p-4 text-caption leading-5 text-muted">
                    {preview.exportJson}
                  </pre>
                </div>
                <div className="grid gap-3">
                  {preview.leads.map((lead) => (
                    <form
                      key={lead.id}
                      action={anonymizeLeadAction}
                      className="rounded-md border border-border bg-canvas p-4"
                    >
                      <input type="hidden" name="leadId" value={lead.id} />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-body-sm font-black text-ink">
                            {lead.fullName || lead.email || lead.phone || lead.id}
                          </p>
                          <p className="mt-1 text-caption font-bold text-muted">
                            {lead.conversations.length} conversations /{" "}
                            {lead.bookings.length} bookings / {lead.exports.length} exports
                          </p>
                        </div>
                        <button className="inline-flex min-h-10 items-center justify-center rounded-md bg-rose px-4 py-2 text-caption font-black text-white">
                          Anonymize lead data
                        </button>
                      </div>
                    </form>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}
