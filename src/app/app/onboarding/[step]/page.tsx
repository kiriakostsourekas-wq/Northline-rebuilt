import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { saveOnboardingStep } from "@/app/app/onboarding/actions";
import { Badge } from "@/components/marketing/badge";
import {
  channelOptions,
  getNextOnboardingStep,
  getOnboardingProgress,
  getOnboardingStep,
  getPreviousOnboardingStep,
  languageOptions,
  leadFieldOptions,
  type OnboardingStepSlug,
} from "@/lib/onboarding";
import { requireCurrentUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Set up your Northline workspace.",
};

export const dynamic = "force-dynamic";

type OnboardingPageProps = {
  params: Promise<{ step: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export default async function OnboardingPage({
  params,
  searchParams,
}: OnboardingPageProps) {
  const { step: stepSlug } = await params;
  const query = await searchParams;
  const step = getOnboardingStep(stepSlug);

  if (!step) notFound();

  const { organization } = await requireCurrentUser();
  const onboarding = organization.onboarding;
  const progress = getOnboardingProgress(step.slug as OnboardingStepSlug);
  const previous = getPreviousOnboardingStep(step.slug as OnboardingStepSlug);
  const next = getNextOnboardingStep(step.slug as OnboardingStepSlug);
  const basics = asRecord(onboarding?.businessBasics);
  const booking = asRecord(onboarding?.bookingPreferences);
  const integration = asRecord(onboarding?.integrationPreference);

  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge tone="teal">Step {progress.current} of {progress.total}</Badge>
            <h1 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              {step.title}
            </h1>
            <p className="mt-3 text-body-sm leading-6 text-muted">
              {step.description}
            </p>
          </div>
          <div className="min-w-36">
            <p className="font-mono text-caption font-black text-muted">
              {progress.percent}% complete
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-sm bg-subtle">
              <div
                className="h-full rounded-sm bg-teal"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        {query?.error ? (
          <div
            role="alert"
            className="mb-5 rounded-md border border-rose/25 bg-rose-soft p-4 text-body-sm font-bold text-rose"
          >
            {query.error}
          </div>
        ) : null}

        <form action={saveOnboardingStep} className="grid gap-5">
          <input type="hidden" name="step" value={step.slug} />
          <StepFields
            step={step.slug as OnboardingStepSlug}
            organizationName={organization.name}
            websiteUrl={organization.websiteUrl}
            primaryMarket={organization.primaryMarket}
            languageMode={onboarding?.languageMode ?? organization.languageMode}
            businessDescription={onboarding?.businessDescription}
            desiredChannels={onboarding?.desiredChannels ?? []}
            leadFields={onboarding?.leadFields ?? []}
            basics={basics}
            booking={booking}
            integration={integration}
          />

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            {previous ? (
              <Link
                href={`/app/onboarding/${previous.slug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-canvas px-5 py-3 text-body-sm font-black text-ink transition-colors hover:border-teal/45"
              >
                Back
              </Link>
            ) : (
              <span />
            )}
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-teal px-5 py-3 text-body-sm font-black text-white shadow-card transition-colors hover:bg-teal-strong"
            >
              {next ? "Save and continue" : "Finish onboarding"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

type StepFieldsProps = {
  step: OnboardingStepSlug;
  organizationName: string;
  websiteUrl?: string | null;
  primaryMarket: string;
  languageMode: string;
  businessDescription?: string | null;
  desiredChannels: readonly string[];
  leadFields: readonly string[];
  basics: Record<string, string>;
  booking: Record<string, string>;
  integration: Record<string, string>;
};

function StepFields({
  step,
  organizationName,
  websiteUrl,
  primaryMarket,
  languageMode,
  businessDescription,
  desiredChannels,
  leadFields,
  basics,
  booking,
  integration,
}: StepFieldsProps) {
  if (step === "business-basics") {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Business name"
          name="businessName"
          defaultValue={basics.businessName || organizationName}
        />
        <TextField
          label="Website"
          name="websiteUrl"
          defaultValue={basics.websiteUrl || websiteUrl || ""}
          placeholder="example.gr"
          required={false}
        />
        <TextField
          label="Primary market"
          name="country"
          defaultValue={basics.country || primaryMarket || "Greece"}
        />
        <TextField
          label="Timezone"
          name="timezone"
          defaultValue={basics.timezone || "Europe/Athens"}
        />
      </div>
    );
  }

  if (step === "languages") {
    return (
      <RadioGroup
        name="languageMode"
        options={languageOptions}
        defaultValue={languageMode}
      />
    );
  }

  if (step === "description") {
    return (
      <label className="grid gap-2 text-body-sm font-bold text-ink">
        Describe the business
        <textarea
          name="businessDescription"
          rows={6}
          required
          defaultValue={businessDescription ?? ""}
          className="resize-y rounded-md border border-border bg-canvas px-3 py-3 text-body-sm text-ink outline-none transition-colors focus:border-teal"
          placeholder="Example: We help property owners in Athens respond to inquiries, qualify tenants, and book viewings."
        />
      </label>
    );
  }

  if (step === "channels") {
    return (
      <CheckboxGrid
        name="channels"
        options={channelOptions}
        selected={desiredChannels}
      />
    );
  }

  if (step === "lead-fields") {
    return (
      <CheckboxGrid
        name="leadFields"
        options={leadFieldOptions.map((field) => ({
          value: field,
          label: field,
        }))}
        selected={leadFields}
      />
    );
  }

  if (step === "booking") {
    return (
      <div className="grid gap-4">
        <RadioGroup
          name="bookingMode"
          defaultValue={booking.bookingMode || "suggest_slots"}
          options={[
            { value: "suggest_slots", label: "Suggest meeting or appointment slots" },
            { value: "send_link", label: "Send an existing scheduling link" },
            { value: "handoff", label: "Route booking requests to a person" },
          ]}
        />
        <TextField
          label="Scheduling link"
          name="schedulingLink"
          defaultValue={booking.schedulingLink || ""}
          placeholder="cal.com/northline or Calendly link"
          required={false}
        />
        <TextField
          label="Default handoff owner"
          name="handoffOwner"
          defaultValue={booking.handoffOwner || ""}
          placeholder="Sales owner or shared inbox"
          required={false}
        />
      </div>
    );
  }

  if (step === "integrations") {
    return (
      <div className="grid gap-4">
        <RadioGroup
          name="crm"
          defaultValue={integration.crm || "none_yet"}
          options={[
            { value: "none_yet", label: "No CRM yet" },
            { value: "spreadsheet", label: "Spreadsheet or Airtable" },
            { value: "hubspot", label: "HubSpot" },
            { value: "pipedrive", label: "Pipedrive" },
            { value: "webhook", label: "Webhook first" },
          ]}
        />
        <TextField
          label="Webhook URL"
          name="webhookUrl"
          defaultValue={integration.webhookUrl || ""}
          placeholder="https://..."
          required={false}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <ReviewRow label="Workspace" value={organizationName} />
      <ReviewRow label="Language mode" value={languageMode.toLowerCase()} />
      <ReviewRow
        label="Channels"
        value={desiredChannels.length ? desiredChannels.join(", ") : "Not set"}
      />
      <ReviewRow
        label="Lead fields"
        value={leadFields.length ? leadFields.join(", ") : "Not set"}
      />
      <ReviewRow
        label="Booking"
        value={booking.bookingMode || "Not set"}
      />
      <ReviewRow label="Destination" value={integration.crm || "Not set"} />
    </div>
  );
}

type Option = {
  value: string;
  label: string;
};

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-body-sm font-bold text-ink">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="min-h-11 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none transition-colors focus:border-teal"
      />
    </label>
  );
}

function RadioGroup({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: readonly Option[];
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-3">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex gap-3 rounded-md border border-border bg-canvas p-4 text-body-sm font-bold text-ink"
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            defaultChecked={defaultValue === option.value}
            className="mt-1 size-4 accent-teal"
            required
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGrid({
  name,
  options,
  selected,
}: {
  name: string;
  options: readonly Option[];
  selected: readonly string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <label
          key={option.value}
          className="flex gap-3 rounded-md border border-border bg-canvas p-4 text-body-sm font-bold text-ink"
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected.includes(option.value)}
            className="mt-1 size-4 accent-teal"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-canvas p-4">
      <p className="text-caption font-black uppercase text-muted">{label}</p>
      <p className="mt-2 text-body-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, string>)
    : {};
}
