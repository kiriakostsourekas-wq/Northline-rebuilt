import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Settings2,
  ShieldAlert,
} from "lucide-react";
import {
  addBlackoutAction,
  cancelBookingAction,
  requestRescheduleBookingAction,
  saveAvailabilityAction,
  saveBookingSettingsAction,
  saveMeetingTypeAction,
  updateBookingStatusAction,
} from "@/app/app/booking/actions";
import { NoticeBanner } from "@/components/app/notice-banner";
import { Badge } from "@/components/marketing/badge";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import { getBookingPageData } from "@/server/booking/queries";

export const metadata: Metadata = {
  title: "Booking",
  description:
    "Northline booking settings, availability, appointments, and calendar workflow.",
};

export const dynamic = "force-dynamic";

type BookingPageProps = {
  searchParams?: Promise<{
    booking?: string | string[];
    error?: string | string[];
    notice?: string | string[];
  }>;
};

const days = [
  ["0", "Sun"],
  ["1", "Mon"],
  ["2", "Tue"],
  ["3", "Wed"],
  ["4", "Thu"],
  ["5", "Fri"],
  ["6", "Sat"],
] as const;

export default async function BookingPage({ searchParams }: BookingPageProps) {
  const query = (await searchParams) ?? {};
  const selectedBookingId = normalizeParam(query.booking);
  const error = normalizeParam(query.error);
  const notice = bookingNoticeMessage(normalizeParam(query.notice));
  const { organization, user } = await requireCompletedOnboarding();
  const canManageBooking = user.role === "OWNER" || user.role === "ADMIN";
  const data = await getBookingPageData({
    organizationId: organization.id,
    selectedBookingId,
  });
  const activeMeetingType = data.meetingTypes[0];

  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
          <div>
            <Badge tone="teal">Booking workflow</Badge>
            <h1 className="mt-4 text-title font-black leading-[var(--line-height-title)]">
              Turn qualified leads into confirmed appointments
            </h1>
            <p className="mt-3 max-w-3xl text-body-sm leading-6 text-muted">
              Configure working hours, buffers, blackout dates, meeting types,
              and provider settings so Northline can suggest slots and confirm
              appointments without double booking.
            </p>
          </div>
          <div className="grid gap-3 rounded-md border border-border bg-canvas p-4">
            <MetricRow label="Timezone" value={data.settings.timezone} />
            <MetricRow
              label="Provider"
              value={formatEnum(data.settings.provider)}
            />
            <MetricRow
              label="Appointments"
              value={String(data.appointments.length)}
            />
          </div>
        </div>
      </section>

      {error ? (
        <NoticeBanner tone="error">{error}</NoticeBanner>
      ) : null}
      {notice ? <NoticeBanner tone="success">{notice}</NoticeBanner> : null}

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-6">
          <SettingsPanel
            settings={data.settings}
            canManage={canManageBooking}
          />
          <MeetingTypePanel
            meetingType={activeMeetingType}
            canManage={canManageBooking}
          />
          <AvailabilityPanel
            windows={data.settings.availabilityWindows}
            canManage={canManageBooking}
          />
          <BlackoutPanel
            blackouts={data.blackouts}
            canManage={canManageBooking}
            timezone={data.settings.timezone}
          />
        </div>

        <aside className="grid h-fit gap-6 2xl:sticky 2xl:top-24">
          <PreviewSlotsPanel slots={data.previewSlots} />
          <AppointmentList
            appointments={data.appointments}
            selectedId={data.selectedBooking?.id}
          />
          <AppointmentDetail
            booking={data.selectedBooking}
            canManage={canManageBooking}
            timezone={data.settings.timezone}
          />
        </aside>
      </section>
    </main>
  );
}

function SettingsPanel({
  settings,
  canManage,
}: {
  settings: Awaited<ReturnType<typeof getBookingPageData>>["settings"];
  canManage: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={Settings2}
        title="Workspace booking settings"
        body="These defaults control slot generation and calendar-provider behavior."
      />
      <form action={saveBookingSettingsAction} className="mt-5 grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Timezone">
            <input
              name="timezone"
              defaultValue={settings.timezone}
              required
              className={inputClassName}
            />
          </Field>
          <Field label="Calendar provider">
            <select
              name="provider"
              defaultValue={settings.provider}
              className={inputClassName}
            >
              <option value="LOCAL_MOCK">Local mock</option>
              <option value="GOOGLE_CALENDAR">Google Calendar</option>
            </select>
          </Field>
          <Field label="Calendar ID">
            <input
              name="calendarId"
              defaultValue={settings.calendarId ?? ""}
              placeholder="primary or calendar id"
              className={inputClassName}
            />
          </Field>
          <Field label="Slot increment">
            <input
              name="slotIncrementMinutes"
              type="number"
              min={10}
              max={120}
              defaultValue={settings.slotIncrementMinutes}
              className={inputClassName}
            />
          </Field>
          <Field label="Minimum notice">
            <input
              name="minNoticeMinutes"
              type="number"
              min={0}
              max={10080}
              defaultValue={settings.minNoticeMinutes}
              className={inputClassName}
            />
          </Field>
          <Field label="Advance booking window">
            <input
              name="maxAdvanceDays"
              type="number"
              min={1}
              max={180}
              defaultValue={settings.maxAdvanceDays}
              className={inputClassName}
            />
          </Field>
        </div>
        <label className="flex items-center gap-3 rounded-md border border-border bg-canvas p-3 text-body-sm font-bold text-ink">
          <input
            name="autoConfirm"
            type="checkbox"
            defaultChecked={settings.autoConfirm}
            className="size-4 accent-teal"
          />
          Auto-confirm after customer selects an available slot
        </label>
        <button disabled={!canManage} className={primaryButtonClassName}>
          Save settings
        </button>
      </form>
    </section>
  );
}

function MeetingTypePanel({
  meetingType,
  canManage,
}: {
  meetingType: Awaited<ReturnType<typeof getBookingPageData>>["meetingTypes"][number];
  canManage: boolean;
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={CalendarClock}
        title="Default meeting type"
        body="The assistant uses the first active meeting type for slot suggestions."
      />
      <form action={saveMeetingTypeAction} className="mt-5 grid gap-4">
        <input type="hidden" name="meetingTypeId" value={meetingType?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Name">
            <input
              name="name"
              defaultValue={meetingType?.name ?? "Discovery call"}
              required
              className={inputClassName}
            />
          </Field>
          <Field label="Duration minutes">
            <input
              name="durationMinutes"
              type="number"
              min={10}
              max={240}
              defaultValue={meetingType?.durationMinutes ?? 30}
              className={inputClassName}
            />
          </Field>
          <Field label="Buffer before">
            <input
              name="bufferBeforeMinutes"
              type="number"
              min={0}
              max={120}
              defaultValue={meetingType?.bufferBeforeMinutes ?? 0}
              className={inputClassName}
            />
          </Field>
          <Field label="Buffer after">
            <input
              name="bufferAfterMinutes"
              type="number"
              min={0}
              max={120}
              defaultValue={meetingType?.bufferAfterMinutes ?? 15}
              className={inputClassName}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            name="description"
            rows={3}
            defaultValue={meetingType?.description ?? ""}
            className={textareaClassName}
          />
        </Field>
        <label className="flex items-center gap-3 rounded-md border border-border bg-canvas p-3 text-body-sm font-bold text-ink">
          <input
            name="isActive"
            type="checkbox"
            defaultChecked={meetingType?.isActive ?? true}
            className="size-4 accent-teal"
          />
          Active
        </label>
        <button disabled={!canManage} className={primaryButtonClassName}>
          Save meeting type
        </button>
      </form>
    </section>
  );
}

function AvailabilityPanel({
  windows,
  canManage,
}: {
  windows: Awaited<
    ReturnType<typeof getBookingPageData>
  >["settings"]["availabilityWindows"];
  canManage: boolean;
}) {
  const byDay = new Map(windows.map((window) => [window.dayOfWeek, window]));

  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={Clock3}
        title="Weekly availability"
        body="Simple working windows keep slot generation predictable for operators."
      />
      <form action={saveAvailabilityAction} className="mt-5 grid gap-3">
        {days.map(([value, label]) => {
          const day = Number(value);
          const window = byDay.get(day);
          return (
            <div
              key={value}
              className="grid gap-3 rounded-md border border-border bg-canvas p-3 sm:grid-cols-[84px_1fr_1fr] sm:items-center"
            >
              <label className="flex items-center gap-2 text-body-sm font-black text-ink">
                <input
                  name={`active-${day}`}
                  type="checkbox"
                  defaultChecked={window?.isActive ?? (day >= 1 && day <= 5)}
                  className="size-4 accent-teal"
                />
                {label}
              </label>
              <input
                aria-label={`${label} start time`}
                name={`start-${day}`}
                type="time"
                defaultValue={window?.startTime ?? "09:00"}
                className={inputClassName}
              />
              <input
                aria-label={`${label} end time`}
                name={`end-${day}`}
                type="time"
                defaultValue={window?.endTime ?? "17:00"}
                className={inputClassName}
              />
            </div>
          );
        })}
        <button disabled={!canManage} className={primaryButtonClassName}>
          Save availability
        </button>
      </form>
    </section>
  );
}

function BlackoutPanel({
  blackouts,
  canManage,
  timezone,
}: {
  blackouts: Awaited<ReturnType<typeof getBookingPageData>>["blackouts"];
  canManage: boolean;
  timezone: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={ShieldAlert}
        title="Blackout dates"
        body="Block holidays, team days, or manually reserved calendar time."
      />
      <form action={addBlackoutAction} className="mt-5 grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Starts">
            <input name="startsAt" type="datetime-local" required className={inputClassName} />
          </Field>
          <Field label="Ends">
            <input name="endsAt" type="datetime-local" required className={inputClassName} />
          </Field>
        </div>
        <Field label="Reason">
          <input
            name="reason"
            placeholder="Holiday, team offsite, manual hold"
            className={inputClassName}
          />
        </Field>
        <button disabled={!canManage} className={primaryButtonClassName}>
          Add blackout
        </button>
      </form>
      <div className="mt-5 grid gap-2">
        {blackouts.length ? (
          blackouts.map((blackout) => (
            <div
              key={blackout.id}
              className="rounded-md border border-border bg-canvas p-3 text-caption"
            >
              <p className="font-black text-ink">
                {formatDateTime(blackout.startsAt, timezone)} to{" "}
                {formatDateTime(blackout.endsAt, timezone)}
              </p>
              <p className="mt-1 font-bold text-muted">
                {blackout.reason ?? "No reason provided"}
              </p>
            </div>
          ))
        ) : (
          <EmptyCard text="No blackout dates configured." />
        )}
      </div>
    </section>
  );
}

function PreviewSlotsPanel({
  slots,
}: {
  slots: Awaited<ReturnType<typeof getBookingPageData>>["previewSlots"];
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={CheckCircle2}
        title="Next suggested slots"
        body="Preview what the assistant can offer right now."
      />
      <div className="mt-4 grid gap-2">
        {slots.length ? (
          slots.map((slot, index) => (
            <div
              key={slot.startsAt.toISOString()}
              className="flex items-center justify-between gap-3 rounded-md bg-canvas p-3 text-body-sm"
            >
              <span className="font-black text-muted">Option {index + 1}</span>
              <span className="text-right font-bold text-ink">{slot.label}</span>
            </div>
          ))
        ) : (
          <EmptyCard text="No slots are available with the current settings." />
        )}
      </div>
    </section>
  );
}

function AppointmentList({
  appointments,
  selectedId,
}: {
  appointments: Awaited<ReturnType<typeof getBookingPageData>>["appointments"];
  selectedId?: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <SectionHeading
        icon={CalendarDays}
        title="Appointments"
        body="Structured records from assistant and operator booking flows."
      />
      <div className="mt-4 grid gap-2">
        {appointments.length ? (
          appointments.map((booking) => {
            const active = booking.id === selectedId;
            return (
              <Link
                key={booking.id}
                href={`/app/booking?booking=${booking.id}`}
                className={`rounded-md border p-3 transition-colors ${
                  active
                    ? "border-teal bg-teal-soft text-teal-strong"
                    : "border-border bg-canvas text-ink hover:border-teal/35"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-body-sm font-black">
                    {booking.lead.fullName ||
                      booking.lead.email ||
                      booking.lead.phone ||
                      "Unknown lead"}
                  </p>
                  <span className="text-caption font-black uppercase">
                    {formatEnum(booking.status)}
                  </span>
                </div>
                <p className="mt-1 text-caption font-bold text-muted">
                  {booking.startsAt
                    ? formatDateTime(booking.startsAt, booking.timezone)
                    : "No time confirmed yet"}
                </p>
              </Link>
            );
          })
        ) : (
          <EmptyCard text="No booking records yet. The assistant will create one after a qualified booking request." />
        )}
      </div>
    </section>
  );
}

function AppointmentDetail({
  booking,
  canManage,
  timezone,
}: {
  booking: Awaited<ReturnType<typeof getBookingPageData>>["selectedBooking"];
  canManage: boolean;
  timezone: string;
}) {
  if (!booking) {
    return (
      <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
        <EmptyCard text="Select an appointment to review booking details." />
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-raised p-5 shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-caption font-black uppercase text-muted">
            Booking detail
          </p>
          <h2 className="mt-2 text-title-sm font-black">
            {booking.customerName ||
              booking.lead.fullName ||
              booking.customerEmail ||
              "Unknown lead"}
          </h2>
        </div>
        <span className="rounded-md bg-subtle px-2.5 py-1 text-caption font-black uppercase text-muted">
          {formatEnum(booking.status)}
        </span>
      </div>
      <dl className="mt-5 grid gap-3 text-body-sm">
        <DetailRow label="Meeting" value={booking.meetingType?.name ?? "Appointment"} />
        <DetailRow
          label="Time"
          value={
            booking.startsAt && booking.endsAt
              ? `${formatDateTime(booking.startsAt, timezone)} to ${formatDateTime(
                  booking.endsAt,
                  timezone,
                )}`
              : "Not confirmed"
          }
        />
        <DetailRow label="Email" value={booking.customerEmail ?? booking.lead.email ?? "Unknown"} />
        <DetailRow label="Phone" value={booking.customerPhone ?? booking.lead.phone ?? "Unknown"} />
        <DetailRow label="Provider" value={formatEnum(booking.provider)} />
        <DetailRow label="External event" value={booking.externalEventId ?? "Not created"} />
      </dl>

      {booking.summary ? (
        <div className="mt-5 rounded-md border border-border bg-canvas p-3">
          <p className="text-caption font-black uppercase text-muted">CRM summary</p>
          <p className="mt-2 text-body-sm leading-6 text-ink">{booking.summary}</p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <form action={requestRescheduleBookingAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <button disabled={!canManage} className={secondaryButtonClassName}>
            Request reschedule
          </button>
        </form>
        <form action={cancelBookingAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="reason" value="Cancelled by operator." />
          <button disabled={!canManage} className={dangerButtonClassName}>
            Cancel
          </button>
        </form>
        <form action={updateBookingStatusAction}>
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="status" value="COMPLETED" />
          <button disabled={!canManage} className={secondaryButtonClassName}>
            Mark complete
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-2">
        <p className="text-caption font-black uppercase text-muted">Event log</p>
        {booking.events.length ? (
          booking.events.map((event) => (
            <div
              key={event.id}
              className="rounded-md border border-border bg-canvas p-3 text-caption"
            >
              <p className="font-black text-ink">{formatEnum(event.eventType)}</p>
              <p className="mt-1 font-bold leading-5 text-muted">{event.message}</p>
              <p className="mt-1 font-mono text-muted">
                {formatDateTime(event.createdAt, timezone)}
              </p>
            </div>
          ))
        ) : (
          <EmptyCard text="No booking events recorded yet." />
        )}
      </div>
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Settings2;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-teal-soft text-teal-strong">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <div>
        <h2 className="text-body font-black">{title}</h2>
        <p className="mt-1 text-caption font-bold leading-5 text-muted">{body}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-caption font-black uppercase text-muted">
      {label}
      {children}
    </label>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md bg-canvas p-3">
      <dt className="font-bold text-muted">{label}</dt>
      <dd className="text-right font-black text-ink">{value}</dd>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-body-sm">
      <span className="font-bold text-muted">{label}</span>
      <span className="text-right font-mono font-black text-ink">{value}</span>
    </div>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-border bg-canvas p-4 text-center text-body-sm font-bold leading-6 text-muted">
      {text}
    </div>
  );
}

function formatDateTime(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function formatEnum(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function bookingNoticeMessage(value?: string) {
  const messages: Record<string, string> = {
    "settings-saved": "Booking settings saved.",
    "meeting-type-saved": "Meeting type saved.",
    "availability-saved": "Availability updated.",
    "blackout-added": "Blackout period added.",
    "booking-cancelled": "Booking cancelled.",
    "reschedule-requested": "Reschedule request recorded.",
    "booking-status-updated": "Booking status updated.",
  };
  return value ? messages[value] : undefined;
}

const inputClassName =
  "min-h-10 rounded-md border border-border bg-canvas px-3 text-body-sm font-bold text-ink outline-none transition-colors focus:border-teal";

const textareaClassName =
  "resize-y rounded-md border border-border bg-canvas px-3 py-3 text-body-sm font-bold text-ink outline-none transition-colors focus:border-teal";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-md bg-ink px-4 py-2 text-caption font-black text-white transition-colors hover:bg-slate disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-canvas px-4 py-2 text-caption font-black text-ink transition-colors hover:border-teal/35 disabled:cursor-not-allowed disabled:text-muted";

const dangerButtonClassName =
  "inline-flex min-h-10 items-center justify-center rounded-md border border-rose/35 bg-rose-soft px-4 py-2 text-caption font-black text-rose transition-colors hover:border-rose disabled:cursor-not-allowed disabled:text-muted";
