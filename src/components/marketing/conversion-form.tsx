"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import {
  marketingEvents,
  trackMarketingEvent,
} from "@/lib/marketing-events";
import {
  type InterestSubmission,
  type InterestType,
  validateInterestSubmission,
} from "@/lib/interest";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "submitting" | "success" | "error";

type ConversionFormProps = {
  type?: InterestType;
  title: string;
  body: string;
  submitLabel: string;
  compact?: boolean;
  location: string;
};

const typeLabels: Record<InterestType, string> = {
  demo: "Request a demo",
  waitlist: "Join the waitlist",
  contact: "Submit interest",
};

export function ConversionForm({
  type = "demo",
  title,
  body,
  submitLabel,
  compact = false,
  location,
}: ConversionFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof InterestSubmission, string>>
  >({});
  const hasTrackedStart = useRef(false);

  function handleFocus() {
    if (hasTrackedStart.current) return;
    hasTrackedStart.current = true;
    trackMarketingEvent(marketingEvents.formStart, {
      formType: type,
      location,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      type: String(formData.get("type") ?? type),
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      website: String(formData.get("website") ?? ""),
      country: String(formData.get("country") ?? ""),
      teamSize: String(formData.get("teamSize") ?? ""),
      message: String(formData.get("message") ?? ""),
      consent: formData.get("consent") === "true",
    };

    trackMarketingEvent(marketingEvents.formSubmit, {
      formType: payload.type,
      location,
    });

    const validation = validateInterestSubmission(payload);
    if (!validation.ok) {
      setStatus("error");
      setMessage(validation.message);
      setFieldErrors(validation.fieldErrors);
      trackMarketingEvent(marketingEvents.formError, {
        formType: payload.type,
        location,
        reason: "client_validation",
      });
      return;
    }

    setStatus("submitting");
    setMessage(null);
    setFieldErrors({});

    try {
      const response = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        fieldErrors?: Partial<Record<keyof InterestSubmission, string>>;
      };

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message ?? "Something went wrong. Try again.");
        setFieldErrors(result.fieldErrors ?? {});
        trackMarketingEvent(marketingEvents.formError, {
          formType: payload.type,
          location,
          reason: "server_validation",
        });
        return;
      }

      form.reset();
      setStatus("success");
      setMessage("Thanks. We received your request and will reply by email.");
      trackMarketingEvent(marketingEvents.formSuccess, {
        formType: payload.type,
        location,
      });
    } catch {
      setStatus("error");
      setMessage("The form could not be submitted. Please try again.");
      trackMarketingEvent(marketingEvents.formError, {
        formType: payload.type,
        location,
        reason: "network",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocus={handleFocus}
      className="rounded-lg border border-border bg-raised p-5 shadow-card sm:p-6"
      data-analytics-event={marketingEvents.formSubmit}
      data-analytics-location={location}
      noValidate
    >
      <div>
        <p className="text-caption font-black uppercase text-teal-strong">
          {typeLabels[type]}
        </p>
        <h2 className="mt-3 text-title-sm font-black leading-tight">{title}</h2>
        <p className="mt-3 text-body-sm leading-6 text-muted">{body}</p>
      </div>

      <input type="hidden" name="type" value={type} />

      <div className={cn("mt-6 grid gap-4", !compact && "sm:grid-cols-2")}>
        <FormField
          id={`${location}-name`}
          name="name"
          label="Name"
          autoComplete="name"
          error={fieldErrors.name}
        />
        <FormField
          id={`${location}-email`}
          name="email"
          label="Work email"
          type="email"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <FormField
          id={`${location}-company`}
          name="company"
          label="Company"
          autoComplete="organization"
          error={fieldErrors.company}
        />
        <FormField
          id={`${location}-website`}
          name="website"
          label="Website"
          placeholder="example.gr"
          autoComplete="url"
          error={fieldErrors.website}
        />
        <FormField
          id={`${location}-country`}
          name="country"
          label="Country"
          placeholder="Greece"
          autoComplete="country-name"
        />
        <label className="grid gap-2 text-body-sm font-bold text-ink">
          Team size
          <select
            name="teamSize"
            className="min-h-11 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none transition-colors focus:border-teal"
            defaultValue=""
          >
            <option value="" disabled>
              Select range
            </option>
            <option value="1-5">1-5</option>
            <option value="6-20">6-20</option>
            <option value="21-100">21-100</option>
            <option value="100+">100+</option>
          </select>
        </label>
      </div>

      <label className="mt-4 grid gap-2 text-body-sm font-bold text-ink">
        Current lead workflow
        <textarea
          name="message"
          rows={compact ? 3 : 4}
          className="resize-y rounded-md border border-border bg-canvas px-3 py-3 text-body-sm text-ink outline-none transition-colors focus:border-teal"
          placeholder="Tell us which channels create leads and where follow-up slows down."
        />
      </label>

      <label className="mt-4 flex gap-3 text-body-sm leading-6 text-muted">
        <input
          type="checkbox"
          name="consent"
          value="true"
          className="mt-1 size-4 rounded border-border accent-teal"
        />
        <span>
          I agree that Northline can contact me about this preview request.
        </span>
      </label>
      {fieldErrors.consent ? (
        <p className="mt-2 text-caption font-bold text-rose">
          {fieldErrors.consent}
        </p>
      ) : null}

      {message ? (
        <div
          className={cn(
            "mt-5 rounded-md border p-4 text-body-sm font-bold",
            status === "success"
              ? "border-teal/25 bg-teal-soft text-teal-strong"
              : "border-rose/25 bg-rose-soft text-rose",
          )}
          role={status === "success" ? "status" : "alert"}
        >
          {status === "success" ? (
            <CheckCircle2 aria-hidden="true" className="mr-2 inline size-4" />
          ) : null}
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-teal px-5 py-3 text-body-sm font-black text-white shadow-card transition-colors hover:bg-teal-strong disabled:cursor-not-allowed disabled:opacity-70"
        data-analytics-event={marketingEvents.formSubmit}
        data-analytics-label={submitLabel}
        data-analytics-location={location}
      >
        {status === "submitting" ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <ArrowRight aria-hidden="true" className="size-4" />
        )}
        <span>{status === "submitting" ? "Submitting..." : submitLabel}</span>
      </button>
    </form>
  );
}

type FormFieldProps = {
  id: string;
  name: keyof InterestSubmission;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
};

function FormField({
  id,
  name,
  label,
  type = "text",
  placeholder,
  autoComplete,
  error,
}: FormFieldProps) {
  return (
    <label className="grid gap-2 text-body-sm font-bold text-ink" htmlFor={id}>
      {label}
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "min-h-11 rounded-md border bg-canvas px-3 text-body-sm text-ink outline-none transition-colors focus:border-teal",
          error ? "border-rose" : "border-border",
        )}
      />
      {error ? (
        <span id={`${id}-error`} className="text-caption font-bold text-rose">
          {error}
        </span>
      ) : null}
    </label>
  );
}
