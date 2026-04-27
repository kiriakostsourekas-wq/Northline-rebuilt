"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { getCalendarProvider, zonedDateTimeToUtc } from "@/lib/booking";
import { requireCompletedOnboarding } from "@/lib/auth/guards";
import { writeAuditLog } from "@/server/audit/service";
import { ensureBookingDefaults } from "@/server/booking/service";
import { getPrismaClient } from "@/server/db";

const providerValues = ["LOCAL_MOCK", "GOOGLE_CALENDAR"] as const;
const appointmentStatusValues = [
  "REQUESTED",
  "SLOT_SUGGESTED",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
] as const;

export async function saveBookingSettingsAction(formData: FormData) {
  const { organization, user } = await requireBookingManager();
  const prisma = getPrismaClient();
  await ensureBookingDefaults({ organizationId: organization.id, prisma });

  await prisma.bookingSettings.update({
    where: { organizationId: organization.id },
    data: {
      timezone: getRequiredString(formData, "timezone"),
      provider: parseProvider(getRequiredString(formData, "provider")),
      calendarId: getOptionalString(formData, "calendarId"),
      slotIncrementMinutes: clampNumber(
        Number(formData.get("slotIncrementMinutes")),
        10,
        120,
        30,
      ),
      minNoticeMinutes: clampNumber(
        Number(formData.get("minNoticeMinutes")),
        0,
        10_080,
        120,
      ),
      maxAdvanceDays: clampNumber(Number(formData.get("maxAdvanceDays")), 1, 180, 30),
      autoConfirm: formData.get("autoConfirm") === "on",
    },
  });

  await logBookingEvent({
    organizationId: organization.id,
    eventType: "BOOKING_SETTINGS_UPDATED",
    message: "Booking settings updated from the workspace UI.",
  });
  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "BOOKING_SETTINGS_UPDATED",
    targetType: "BookingSettings",
    targetId: organization.id,
    metadata: {
      provider: parseProvider(getRequiredString(formData, "provider")),
      autoConfirm: formData.get("autoConfirm") === "on",
    },
  });

  revalidatePath("/app/booking");
  redirect("/app/booking?notice=settings-saved");
}

export async function saveMeetingTypeAction(formData: FormData) {
  const { organization, user } = await requireBookingManager();
  const prisma = getPrismaClient();
  const meetingTypeId = getOptionalString(formData, "meetingTypeId");
  const data = {
    name: getRequiredString(formData, "name"),
    description: getOptionalString(formData, "description"),
    durationMinutes: clampNumber(Number(formData.get("durationMinutes")), 10, 240, 30),
    bufferBeforeMinutes: clampNumber(
      Number(formData.get("bufferBeforeMinutes")),
      0,
      120,
      0,
    ),
    bufferAfterMinutes: clampNumber(
      Number(formData.get("bufferAfterMinutes")),
      0,
      120,
      15,
    ),
    isActive: formData.get("isActive") === "on",
  };

  if (meetingTypeId) {
    await prisma.meetingType.updateMany({
      where: { id: meetingTypeId, organizationId: organization.id },
      data,
    });
  } else {
    await prisma.meetingType.create({
      data: {
        organizationId: organization.id,
        ...data,
      },
    });
  }

  await logBookingEvent({
    organizationId: organization.id,
    eventType: "MEETING_TYPE_SAVED",
    message: "A meeting type was saved from the workspace UI.",
  });
  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: meetingTypeId ? "MEETING_TYPE_UPDATED" : "MEETING_TYPE_CREATED",
    targetType: "MeetingType",
    targetId: meetingTypeId,
    metadata: {
      durationMinutes: data.durationMinutes,
      isActive: data.isActive,
    },
  });

  revalidatePath("/app/booking");
  redirect("/app/booking?notice=meeting-type-saved");
}

export async function saveAvailabilityAction(formData: FormData) {
  const { organization, user } = await requireBookingManager();
  const prisma = getPrismaClient();
  const { settings } = await ensureBookingDefaults({
    organizationId: organization.id,
    prisma,
  });

  const windows = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const isActive = formData.get(`active-${dayOfWeek}`) === "on";
    return {
      dayOfWeek,
      startTime: getTimeString(formData, `start-${dayOfWeek}`, "09:00"),
      endTime: getTimeString(formData, `end-${dayOfWeek}`, "17:00"),
      isActive,
    };
  });

  await prisma.$transaction(async (tx) => {
    await tx.availabilityWindow.deleteMany({
      where: { bookingSettingsId: settings.id },
    });
    await tx.availabilityWindow.createMany({
      data: windows.map((window) => ({
        bookingSettingsId: settings.id,
        ...window,
      })),
    });
    await tx.bookingEvent.create({
      data: {
        organizationId: organization.id,
        eventType: "AVAILABILITY_UPDATED",
        message: "Availability windows were replaced from the workspace UI.",
        metadata: toJson({ windows }),
      },
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "AVAILABILITY_UPDATED",
      targetType: "BookingSettings",
      targetId: settings.id,
      metadata: { activeDays: windows.filter((window) => window.isActive).length },
      prisma: tx,
    });
  });

  revalidatePath("/app/booking");
  redirect("/app/booking?notice=availability-saved");
}

export async function addBlackoutAction(formData: FormData) {
  const { organization, user } = await requireBookingManager();
  const prisma = getPrismaClient();
  const { settings } = await ensureBookingDefaults({
    organizationId: organization.id,
    prisma,
  });
  const startsAt = parseLocalDateTime(
    getRequiredString(formData, "startsAt"),
    settings.timezone,
  );
  const endsAt = parseLocalDateTime(
    getRequiredString(formData, "endsAt"),
    settings.timezone,
  );

  if (!startsAt || !endsAt || startsAt >= endsAt) {
    redirect("/app/booking?error=Blackout end time must be after the start time.");
  }

  await prisma.bookingBlackout.create({
    data: {
      organizationId: organization.id,
      startsAt,
      endsAt,
      reason: getOptionalString(formData, "reason"),
    },
  });
  await logBookingEvent({
    organizationId: organization.id,
    eventType: "BLACKOUT_ADDED",
    message: "A blackout period was added.",
    metadata: toJson({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() }),
  });
  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "BOOKING_BLACKOUT_CREATED",
    targetType: "BookingBlackout",
    metadata: {
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    },
  });

  revalidatePath("/app/booking");
  redirect("/app/booking?notice=blackout-added");
}

export async function cancelBookingAction(formData: FormData) {
  const { organization, user } = await requireBookingManager();
  const bookingId = getRequiredString(formData, "bookingId");
  const reason = getOptionalString(formData, "reason") ?? "Cancelled from booking admin.";
  const prisma = getPrismaClient();
  const booking = await prisma.bookingRequest.findFirst({
    where: { id: bookingId, organizationId: organization.id },
  });

  if (!booking) redirect("/app/booking?error=Booking not found.");

  if (booking.externalEventId) {
    const provider = getCalendarProvider(booking.provider);
    await provider.cancelEvent({
      externalEventId: booking.externalEventId,
      reason,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.bookingRequest.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
    });
    await tx.bookingEvent.create({
      data: {
        organizationId: organization.id,
        bookingRequestId: booking.id,
        eventType: "BOOKING_CANCELLED",
        message: reason,
      },
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "BOOKING_CANCELLED",
      targetType: "BookingRequest",
      targetId: booking.id,
      prisma: tx,
    });
  });

  revalidatePath("/app/booking");
  redirect(`/app/booking?booking=${booking.id}&notice=booking-cancelled`);
}

export async function requestRescheduleBookingAction(formData: FormData) {
  const { organization, user } = await requireBookingManager();
  const bookingId = getRequiredString(formData, "bookingId");
  const prisma = getPrismaClient();

  await prisma.$transaction(async (tx) => {
    const booking = await tx.bookingRequest.findFirst({
      where: { id: bookingId, organizationId: organization.id },
    });
    if (!booking) return;
    await tx.bookingRequest.update({
      where: { id: booking.id },
      data: { status: "RESCHEDULE_REQUESTED" },
    });
    await tx.bookingEvent.create({
      data: {
        organizationId: organization.id,
        bookingRequestId: booking.id,
        eventType: "RESCHEDULE_REQUESTED",
        message:
          "Reschedule requested from the booking admin. Future workflow will suggest replacement slots.",
      },
    });
    await writeAuditLog({
      organizationId: organization.id,
      actorUserId: user.id,
      action: "BOOKING_RESCHEDULE_REQUESTED",
      targetType: "BookingRequest",
      targetId: booking.id,
      prisma: tx,
    });
  });

  revalidatePath("/app/booking");
  redirect(`/app/booking?booking=${bookingId}&notice=reschedule-requested`);
}

export async function updateBookingStatusAction(formData: FormData) {
  const { organization, user } = await requireBookingManager();
  const bookingId = getRequiredString(formData, "bookingId");
  const status = parseAppointmentStatus(getRequiredString(formData, "status"));

  await getPrismaClient().bookingRequest.updateMany({
    where: { id: bookingId, organizationId: organization.id },
    data: { status },
  });
  await logBookingEvent({
    organizationId: organization.id,
    bookingRequestId: bookingId,
    eventType: "BOOKING_STATUS_UPDATED",
    message: `Booking status updated to ${status}.`,
  });
  await writeAuditLog({
    organizationId: organization.id,
    actorUserId: user.id,
    action: "BOOKING_STATUS_UPDATED",
    targetType: "BookingRequest",
    targetId: bookingId,
    metadata: { status },
  });

  revalidatePath("/app/booking");
  redirect(`/app/booking?booking=${bookingId}&notice=booking-status-updated`);
}

async function requireBookingManager() {
  const context = await requireCompletedOnboarding();
  if (context.user.role !== "OWNER" && context.user.role !== "ADMIN") {
    redirect("/app/booking?error=Only owners and admins can edit booking settings.");
  }
  return context;
}

async function logBookingEvent(input: {
  organizationId: string;
  bookingRequestId?: string;
  eventType: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await getPrismaClient().bookingEvent.create({
    data: {
      organizationId: input.organizationId,
      bookingRequestId: input.bookingRequestId,
      eventType: input.eventType,
      message: input.message,
      metadata: input.metadata,
    },
  });
}

function parseProvider(value: string) {
  if (providerValues.includes(value as (typeof providerValues)[number])) {
    return value as (typeof providerValues)[number];
  }
  return "LOCAL_MOCK";
}

function parseAppointmentStatus(value: string) {
  if (
    appointmentStatusValues.includes(
      value as (typeof appointmentStatusValues)[number],
    )
  ) {
    return value as (typeof appointmentStatusValues)[number];
  }
  return "REQUESTED";
}

function parseLocalDateTime(value: string, timezone: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
  if (!match) return null;
  return zonedDateTimeToUtc({
    dateKey: match[1],
    time: match[2],
    timeZone: timezone,
  });
}

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required.`);
  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getTimeString(formData: FormData, key: string, fallback: string) {
  const value = String(formData.get(key) ?? fallback).trim();
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.round(value), min), max);
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}
