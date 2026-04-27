import {
  addMinutes,
  addZonedDays,
  formatSlotRange,
  getZonedDateKey,
  getZonedDayOfWeek,
  minutesFromClock,
  zonedDateTimeToUtc,
} from "@/lib/booking/time";
import type {
  AvailabilityWindowSnapshot,
  BookingBlackoutSnapshot,
  BookingConflictSnapshot,
  BookingSettingsSnapshot,
  BookingSlot,
  MeetingTypeSnapshot,
} from "@/lib/booking/types";

const blockingStatuses = new Set([
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
]);

export type GenerateSlotsInput = {
  settings: BookingSettingsSnapshot;
  meetingType: MeetingTypeSnapshot;
  availabilityWindows: AvailabilityWindowSnapshot[];
  blackouts?: BookingBlackoutSnapshot[];
  existingBookings?: BookingConflictSnapshot[];
  now?: Date;
  limit?: number;
};

export function generateAvailableSlots(input: GenerateSlotsInput): BookingSlot[] {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 6;
  const minStart = addMinutes(now, input.settings.minNoticeMinutes);
  const maxStart = addZonedDays(
    now,
    input.settings.maxAdvanceDays,
    input.settings.timezone,
  );
  const activeWindows = input.availabilityWindows
    .filter((window) => window.isActive)
    .filter((window) => isValidWindow(window))
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  const slots: BookingSlot[] = [];

  if (!input.meetingType.isActive || activeWindows.length === 0) return slots;

  for (let dayOffset = 0; dayOffset <= input.settings.maxAdvanceDays; dayOffset += 1) {
    const dayStart = addZonedDays(now, dayOffset, input.settings.timezone);
    const dateKey = getZonedDateKey(dayStart, input.settings.timezone);
    const dayOfWeek = getZonedDayOfWeek(dayStart, input.settings.timezone);
    const windows = activeWindows.filter((window) => window.dayOfWeek === dayOfWeek);

    for (const window of windows) {
      const windowStart = minutesFromClock(window.startTime);
      const windowEnd = minutesFromClock(window.endTime);
      if (windowStart === null || windowEnd === null) continue;

      for (
        let startMinute = alignToIncrement(
          windowStart,
          input.settings.slotIncrementMinutes,
        );
        startMinute + input.meetingType.durationMinutes <= windowEnd;
        startMinute += input.settings.slotIncrementMinutes
      ) {
        const startsAt = zonedDateTimeToUtc({
          dateKey,
          time: minutesToClock(startMinute),
          timeZone: input.settings.timezone,
        });
        if (!startsAt) continue;
        const endsAt = addMinutes(startsAt, input.meetingType.durationMinutes);

        if (startsAt < minStart || startsAt > maxStart) continue;
        if (
          hasAnyOverlap(
            applyBuffers(
              { startsAt, endsAt },
              input.meetingType.bufferBeforeMinutes,
              input.meetingType.bufferAfterMinutes,
            ),
            [...(input.blackouts ?? []), ...activeConflicts(input.existingBookings ?? [])],
          )
        ) {
          continue;
        }

        slots.push({
          startsAt,
          endsAt,
          timezone: input.settings.timezone,
          label: formatSlotRange({
            startsAt,
            endsAt,
            timeZone: input.settings.timezone,
            locale: "EN",
          }),
        });

        if (slots.length >= limit) return slots;
      }
    }
  }

  return slots;
}

export function selectSuggestedSlot(input: {
  message: string;
  suggestedSlots: BookingSlot[];
}) {
  const normalized = input.message.trim().toLowerCase();
  if (!normalized || input.suggestedSlots.length === 0) return null;

  const ordinalMatch =
    normalized.match(/\b(?:slot|option)?\s*([1-6])\b/) ??
    normalized.match(/\b(first|second|third|fourth|fifth|sixth)\b/) ??
    normalized.match(/\b(πρωτο|δευτερο|τριτο|τεταρτο|πεμπτο|εκτο)\b/);
  const ordinal = ordinalMatch?.[1] ? ordinalToIndex(ordinalMatch[1]) : null;
  if (ordinal !== null) return input.suggestedSlots[ordinal] ?? null;

  for (const slot of input.suggestedSlots) {
    const slotHour = new Intl.DateTimeFormat("en-GB", {
      timeZone: slot.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(slot.startsAt);
    const compact = slotHour.replace(":", "");
    if (normalized.includes(slotHour) || normalized.includes(compact)) {
      return slot;
    }
  }

  if (/(confirm|confirmed|works|ok|yes|ναι|ενταξει|κλειστο)/i.test(normalized)) {
    return input.suggestedSlots[0] ?? null;
  }

  return null;
}

export function summarizeBooking(input: {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  meetingTypeName: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  timezone: string;
  serviceInterest?: string | null;
}) {
  const details = [
    input.customerName ? `Customer: ${input.customerName}` : null,
    input.customerEmail ? `Email: ${input.customerEmail}` : null,
    input.customerPhone ? `Phone: ${input.customerPhone}` : null,
    `Meeting: ${input.meetingTypeName}`,
    input.startsAt && input.endsAt
      ? `Time: ${formatSlotRange({
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          timeZone: input.timezone,
        })}`
      : null,
    input.serviceInterest ? `Interest: ${input.serviceInterest}` : null,
  ].filter(Boolean);

  return details.join(" / ");
}

export function isBookableStatus(status: string) {
  return blockingStatuses.has(status);
}

function isValidWindow(window: AvailabilityWindowSnapshot) {
  const start = minutesFromClock(window.startTime);
  const end = minutesFromClock(window.endTime);
  return (
    Number.isInteger(window.dayOfWeek) &&
    window.dayOfWeek >= 0 &&
    window.dayOfWeek <= 6 &&
    start !== null &&
    end !== null &&
    start < end
  );
}

function alignToIncrement(value: number, increment: number) {
  if (increment <= 0) return value;
  return Math.ceil(value / increment) * increment;
}

function minutesToClock(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function applyBuffers(
  slot: { startsAt: Date; endsAt: Date },
  beforeMinutes: number,
  afterMinutes: number,
) {
  return {
    startsAt: addMinutes(slot.startsAt, -beforeMinutes),
    endsAt: addMinutes(slot.endsAt, afterMinutes),
  };
}

function activeConflicts(bookings: BookingConflictSnapshot[]) {
  return bookings.filter(
    (booking) =>
      booking.startsAt &&
      booking.endsAt &&
      (!booking.status || blockingStatuses.has(String(booking.status))),
  );
}

function hasAnyOverlap(
  slot: { startsAt: Date; endsAt: Date },
  intervals: Array<{ startsAt: Date; endsAt: Date }>,
) {
  return intervals.some((interval) => slot.startsAt < interval.endsAt && slot.endsAt > interval.startsAt);
}

function ordinalToIndex(value: string) {
  const normalized = value.toLowerCase();
  const words: Record<string, number> = {
    first: 0,
    second: 1,
    third: 2,
    fourth: 3,
    fifth: 4,
    sixth: 5,
    πρωτο: 0,
    δευτερο: 1,
    τριτο: 2,
    τεταρτο: 3,
    πεμπτο: 4,
    εκτο: 5,
  };
  if (normalized in words) return words[normalized];
  const asNumber = Number(normalized);
  return Number.isInteger(asNumber) && asNumber >= 1 ? asNumber - 1 : null;
}
