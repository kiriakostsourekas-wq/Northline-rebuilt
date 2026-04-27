import { describe, expect, it } from "vitest";
import {
  generateAvailableSlots,
  selectSuggestedSlot,
  summarizeBooking,
} from "@/lib/booking/availability";
import type {
  AvailabilityWindowSnapshot,
  BookingSettingsSnapshot,
  MeetingTypeSnapshot,
} from "@/lib/booking/types";

const settings: BookingSettingsSnapshot = {
  timezone: "Europe/Athens",
  provider: "LOCAL_MOCK",
  slotIncrementMinutes: 30,
  minNoticeMinutes: 0,
  maxAdvanceDays: 7,
  autoConfirm: true,
};

const meetingType: MeetingTypeSnapshot = {
  name: "Discovery call",
  durationMinutes: 30,
  bufferBeforeMinutes: 0,
  bufferAfterMinutes: 15,
  isActive: true,
};

const mondayWindow: AvailabilityWindowSnapshot = {
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "11:00",
  isActive: true,
};

describe("booking availability", () => {
  it("generates timezone-aware slots inside working hours", () => {
    const slots = generateAvailableSlots({
      settings,
      meetingType,
      availabilityWindows: [mondayWindow],
      now: new Date("2026-04-27T05:00:00.000Z"),
      limit: 4,
    });

    expect(slots).toHaveLength(4);
    expect(localTime(slots[0].startsAt)).toBe("09:00");
    expect(localTime(slots[0].endsAt)).toBe("09:30");
    expect(slots[0].timezone).toBe("Europe/Athens");
  });

  it("respects conflicts, buffers, and blackout periods", () => {
    const slots = generateAvailableSlots({
      settings,
      meetingType,
      availabilityWindows: [mondayWindow],
      now: new Date("2026-04-27T05:00:00.000Z"),
      existingBookings: [
        {
          id: "confirmed",
          startsAt: new Date("2026-04-27T07:00:00.000Z"),
          endsAt: new Date("2026-04-27T07:30:00.000Z"),
          status: "CONFIRMED",
        },
      ],
      blackouts: [
        {
          startsAt: new Date("2026-04-27T07:15:00.000Z"),
          endsAt: new Date("2026-04-27T08:15:00.000Z"),
        },
      ],
      limit: 6,
    });

    expect(slots.map((slot) => localTime(slot.startsAt))).toEqual(["09:00"]);
  });

  it("honors minimum notice before suggesting slots", () => {
    const slots = generateAvailableSlots({
      settings: { ...settings, minNoticeMinutes: 90 },
      meetingType,
      availabilityWindows: [mondayWindow],
      now: new Date("2026-04-27T05:00:00.000Z"),
      limit: 4,
    });

    expect(slots.map((slot) => localTime(slot.startsAt))).toEqual([
      "09:30",
      "10:00",
      "10:30",
    ]);
  });

  it("selects customer slot confirmations from ordinal replies", () => {
    const slots = generateAvailableSlots({
      settings,
      meetingType,
      availabilityWindows: [mondayWindow],
      now: new Date("2026-04-27T05:00:00.000Z"),
      limit: 3,
    });

    expect(selectSuggestedSlot({ message: "2 works for me", suggestedSlots: slots }))
      .toEqual(slots[1]);
    expect(selectSuggestedSlot({ message: "ναι", suggestedSlots: slots })).toEqual(
      slots[0],
    );
  });

  it("creates concise booking summaries for CRM and human review", () => {
    const summary = summarizeBooking({
      customerName: "Maria",
      customerEmail: "maria@example.com",
      meetingTypeName: "Discovery call",
      startsAt: new Date("2026-04-27T06:00:00.000Z"),
      endsAt: new Date("2026-04-27T06:30:00.000Z"),
      timezone: "Europe/Athens",
      serviceInterest: "AI sales assistant setup",
    });

    expect(summary).toContain("Customer: Maria");
    expect(summary).toContain("Meeting: Discovery call");
    expect(summary).toContain("Interest: AI sales assistant setup");
  });
});

function localTime(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Athens",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
