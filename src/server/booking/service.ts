import { Prisma } from "@/generated/prisma/client";
import {
  formatSlotRange,
  generateAvailableSlots,
  getCalendarProvider,
  selectSuggestedSlot,
  summarizeBooking,
  type BookingSlot,
} from "@/lib/booking";
import type { ConversationEngineDecision } from "@/lib/conversation-engine/types";
import { safeErrorMessage } from "@/lib/security/logging";
import { triggerLeadExport } from "@/server/destinations/service";
import { getPrismaClient } from "@/server/db";

const defaultAvailability = [
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 5, startTime: "09:00", endTime: "16:00" },
];

const blockingStatuses = [
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "RESCHEDULE_REQUESTED",
] as const;

export async function ensureBookingDefaults(input: {
  organizationId: string;
  prisma?: ReturnType<typeof getPrismaClient>;
}) {
  const prisma = input.prisma ?? getPrismaClient();
  const organization = await prisma.organization.findUnique({
    where: { id: input.organizationId },
    select: {
      id: true,
      defaultLocale: true,
      businessProfile: { select: { timezone: true } },
    },
  });

  if (!organization) throw new Error("Workspace not found.");

  let settings = await prisma.bookingSettings.findUnique({
    where: { organizationId: input.organizationId },
    include: { availabilityWindows: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } },
  });

  if (!settings) {
    settings = await prisma.bookingSettings.create({
      data: {
        organizationId: input.organizationId,
        timezone: organization.businessProfile?.timezone ?? "Europe/Athens",
        availabilityWindows: {
          create: defaultAvailability.map((window) => ({
            ...window,
            isActive: true,
          })),
        },
      },
      include: { availabilityWindows: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] } },
    });
  }

  let meetingType = await prisma.meetingType.findFirst({
    where: { organizationId: input.organizationId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (!meetingType) {
    meetingType = await prisma.meetingType.create({
      data: {
        organizationId: input.organizationId,
        name: "Discovery call",
        description: "A short qualification and next-step call.",
        durationMinutes: 30,
        bufferBeforeMinutes: 0,
        bufferAfterMinutes: 15,
        isActive: true,
        sortOrder: 0,
      },
    });
  }

  return {
    settings,
    defaultMeetingType: meetingType,
  };
}

export async function advanceBookingWorkflow(input: {
  organizationId: string;
  conversationId: string;
  leadId: string;
  latestMessage: string;
  decision: ConversationEngineDecision;
}) {
  const prisma = getPrismaClient();
  const locale = input.decision.replyLocale;
  const existing = await prisma.bookingRequest.findFirst({
    where: {
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      status: { in: ["SLOT_SUGGESTED", "PENDING_CONFIRMATION", "RESCHEDULE_REQUESTED"] },
    },
    include: { meetingType: true },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const selected = selectSuggestedSlot({
      message: input.latestMessage,
      suggestedSlots: parseSuggestedSlots(existing.structuredData, existing.timezone),
    });

    if (selected) {
      return confirmSuggestedBooking({
        bookingId: existing.id,
        organizationId: input.organizationId,
        selectedSlot: selected,
        locale,
      });
    }
  }

  const shouldSuggestSlots =
    input.decision.intent === "BOOKING_REQUEST" &&
    input.decision.state.stage === "BOOKING_READY" &&
    hasContactForBooking(input.decision.mergedLead);

  if (!shouldSuggestSlots) return null;

  return suggestSlotsForConversation({
    organizationId: input.organizationId,
    conversationId: input.conversationId,
    leadId: input.leadId,
    decision: input.decision,
    existingBookingId: existing?.id,
  });
}

export async function suggestSlotsForConversation(input: {
  organizationId: string;
  conversationId?: string | null;
  leadId: string;
  decision: ConversationEngineDecision;
  existingBookingId?: string;
}) {
  const prisma = getPrismaClient();
  const { settings, defaultMeetingType } = await ensureBookingDefaults({
    organizationId: input.organizationId,
    prisma,
  });
  const [blackouts, existingBookings, lead] = await Promise.all([
    prisma.bookingBlackout.findMany({
      where: {
        organizationId: input.organizationId,
        endsAt: { gte: new Date() },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.bookingRequest.findMany({
      where: {
        organizationId: input.organizationId,
        status: { in: [...blockingStatuses] },
        startsAt: { not: null },
        endsAt: { not: null },
        ...(input.existingBookingId ? { id: { not: input.existingBookingId } } : {}),
      },
      select: { id: true, startsAt: true, endsAt: true, status: true },
    }),
    prisma.lead.findFirst({
      where: { id: input.leadId, organizationId: input.organizationId },
    }),
  ]);

  if (!lead) throw new Error("Lead not found for booking workflow.");

  const slots = generateAvailableSlots({
    settings,
    meetingType: defaultMeetingType,
    availabilityWindows: settings.availabilityWindows,
    blackouts,
    existingBookings: existingBookings.flatMap((booking) =>
      booking.startsAt && booking.endsAt
        ? [
            {
              id: booking.id,
              startsAt: booking.startsAt,
              endsAt: booking.endsAt,
              status: booking.status,
            },
          ]
        : [],
    ),
    limit: 3,
  });

  if (slots.length === 0) {
    await prisma.bookingEvent.create({
      data: {
        organizationId: input.organizationId,
        eventType: "NO_SLOTS_AVAILABLE",
        message: "No available slots could be generated for the booking request.",
        metadata: toJson({
          conversationId: input.conversationId,
          leadId: input.leadId,
        }),
      },
    });
    return {
      bookingId: input.existingBookingId,
      status: "REQUESTED",
      replyOverride:
        input.decision.replyLocale === "EL"
          ? "Δεν βρίσκω διαθέσιμες ώρες με βάση το τρέχον πρόγραμμα. Θα το προωθήσω στην ομάδα για να προτείνει χειροκίνητα διαθέσιμη ώρα."
          : "I cannot find an available slot from the current schedule. I’ll route this to the team so they can offer a time manually.",
    };
  }

  const summary = summarizeBooking({
    customerName: lead.fullName,
    customerEmail: lead.email,
    customerPhone: lead.phone,
    meetingTypeName: defaultMeetingType.name,
    timezone: settings.timezone,
    serviceInterest: lead.serviceInterest,
  });
  const structuredData = toJson({
    source: "conversation_engine",
    suggestedSlots: slots.map(serializeSlot),
    missingConfirmationFields: missingConfirmationFields(lead),
    leadSnapshot: {
      name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      serviceInterest: lead.serviceInterest,
      urgency: lead.urgency,
      location: lead.location,
    },
  });
  const booking = input.existingBookingId
    ? await prisma.bookingRequest.update({
        where: { id: input.existingBookingId },
        data: {
          status: "SLOT_SUGGESTED",
          meetingTypeId: defaultMeetingType.id,
          timezone: settings.timezone,
          provider: settings.provider,
          customerName: lead.fullName,
          customerEmail: lead.email,
          customerPhone: lead.phone,
          customerLocale: input.decision.replyLocale,
          summary,
          structuredData,
        },
      })
    : await prisma.bookingRequest.create({
        data: {
          organizationId: input.organizationId,
          leadId: input.leadId,
          conversationId: input.conversationId,
          meetingTypeId: defaultMeetingType.id,
          timezone: settings.timezone,
          status: "SLOT_SUGGESTED",
          provider: settings.provider,
          customerName: lead.fullName,
          customerEmail: lead.email,
          customerPhone: lead.phone,
          customerLocale: input.decision.replyLocale,
          summary,
          structuredData,
          notes: input.decision.summary,
        },
      });

  await prisma.bookingEvent.create({
    data: {
      organizationId: input.organizationId,
      bookingRequestId: booking.id,
      eventType: "SLOTS_SUGGESTED",
      message: "Northline suggested booking slots from workspace availability.",
      metadata: toJson({ suggestedSlots: slots.map(serializeSlot) }),
    },
  });

  console.info("northline.booking.slots_suggested", {
    bookingId: booking.id,
    conversationId: input.conversationId,
    slotCount: slots.length,
  });

  return {
    bookingId: booking.id,
    status: "SLOT_SUGGESTED",
    replyOverride: buildSlotSuggestionReply(slots, input.decision.replyLocale),
  };
}

export async function confirmSuggestedBooking(input: {
  organizationId: string;
  bookingId: string;
  selectedSlot: BookingSlot;
  locale: "EN" | "EL";
}) {
  const prisma = getPrismaClient();
  const booking = await prisma.bookingRequest.findFirst({
    where: {
      id: input.bookingId,
      organizationId: input.organizationId,
    },
    include: {
      lead: true,
      meetingType: true,
      organization: {
        select: {
          id: true,
          bookingSettings: true,
        },
      },
    },
  });

  if (!booking) throw new Error("Booking request not found.");
  if (!booking.customerEmail && !booking.customerPhone && !booking.lead.email && !booking.lead.phone) {
    return {
      bookingId: booking.id,
      status: booking.status,
      replyOverride:
        input.locale === "EL"
          ? "Μπορώ να το κλείσω, αλλά χρειάζομαι πρώτα email ή τηλέφωνο για επιβεβαίωση."
          : "I can book that, but I need an email or phone number first so the team can confirm the appointment.",
    };
  }

  const conflict = await hasBookingConflict({
    organizationId: input.organizationId,
    startsAt: input.selectedSlot.startsAt,
    endsAt: input.selectedSlot.endsAt,
    excludeBookingId: booking.id,
  });

  if (conflict) {
    await prisma.bookingEvent.create({
      data: {
        organizationId: input.organizationId,
        bookingRequestId: booking.id,
        eventType: "SELECTED_SLOT_CONFLICTED",
        message: "The selected slot conflicted before confirmation.",
        metadata: toJson(serializeSlot(input.selectedSlot)),
      },
    });

    return {
      bookingId: booking.id,
      status: "SLOT_SUGGESTED",
      replyOverride:
        input.locale === "EL"
          ? "Αυτή η ώρα μόλις δεσμεύτηκε. Θα προτείνω νέα διαθέσιμη ώρα."
          : "That time was just taken. I’ll suggest a new available slot.",
    };
  }

  const settings = booking.organization.bookingSettings;
  const provider = getCalendarProvider(settings?.provider ?? "LOCAL_MOCK");
  const meetingTypeName = booking.meetingType?.name ?? "Appointment";
  const summary = summarizeBooking({
    customerName: booking.customerName ?? booking.lead.fullName,
    customerEmail: booking.customerEmail ?? booking.lead.email,
    customerPhone: booking.customerPhone ?? booking.lead.phone,
    meetingTypeName,
    startsAt: input.selectedSlot.startsAt,
    endsAt: input.selectedSlot.endsAt,
    timezone: booking.timezone,
    serviceInterest: booking.lead.serviceInterest,
  });
  const event = await provider.createEvent({
    bookingId: booking.id,
    calendarId: settings?.calendarId,
    summary,
    description: booking.notes,
    startsAt: input.selectedSlot.startsAt,
    endsAt: input.selectedSlot.endsAt,
    timezone: booking.timezone,
    customer: {
      name: booking.customerName ?? booking.lead.fullName,
      email: booking.customerEmail ?? booking.lead.email,
      phone: booking.customerPhone ?? booking.lead.phone,
    },
  });

  await prisma.$transaction(
    async (tx) => {
      await tx.bookingRequest.update({
        where: { id: booking.id },
        data: {
          status: "CONFIRMED",
          startsAt: input.selectedSlot.startsAt,
          endsAt: input.selectedSlot.endsAt,
          provider: event.provider,
          externalEventId: event.externalEventId,
          summary,
          confirmedAt: new Date(),
          structuredData: mergeStructuredData(booking.structuredData, {
            confirmedSlot: serializeSlot(input.selectedSlot),
            provider: event.provider,
            externalEventId: event.externalEventId,
          }),
        },
      });
      await tx.bookingEvent.create({
        data: {
          organizationId: input.organizationId,
          bookingRequestId: booking.id,
          eventType: "BOOKING_CONFIRMED",
          message: "Booking confirmed and calendar provider event created.",
          metadata: toJson({
            slot: serializeSlot(input.selectedSlot),
            provider: event.provider,
            externalEventId: event.externalEventId,
          }),
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  console.info("northline.booking.confirmed", {
    bookingId: booking.id,
    provider: event.provider,
    externalEventId: event.externalEventId,
  });

  try {
    await triggerLeadExport({
      organizationId: input.organizationId,
      leadId: booking.leadId,
      conversationId: booking.conversationId,
      bookingRequestId: booking.id,
      eventType: "BOOKING_CONFIRMED",
    });
  } catch (error) {
    console.error("northline.export.booking_confirmed_failed", {
      bookingId: booking.id,
      error: safeErrorMessage(error),
    });
  }

  return {
    bookingId: booking.id,
    status: "CONFIRMED",
    replyOverride: buildConfirmationReply(input.selectedSlot, input.locale),
  };
}

export async function hasBookingConflict(input: {
  organizationId: string;
  startsAt: Date;
  endsAt: Date;
  excludeBookingId?: string;
}) {
  const prisma = getPrismaClient();
  const conflict = await prisma.bookingRequest.findFirst({
    where: {
      organizationId: input.organizationId,
      status: { in: [...blockingStatuses] },
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
      ...(input.excludeBookingId ? { id: { not: input.excludeBookingId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(conflict);
}

function hasContactForBooking(lead: ConversationEngineDecision["mergedLead"]) {
  return Boolean(lead.email || lead.phone);
}

function missingConfirmationFields(lead: {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  return [
    lead.fullName ? null : "name",
    lead.email || lead.phone ? null : "contact_method",
  ].filter(Boolean);
}

function buildSlotSuggestionReply(slots: BookingSlot[], locale: "EN" | "EL") {
  const lines = slots.map((slot, index) => {
    const label = formatSlotRange({
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
      timeZone: slot.timezone,
      locale,
    });
    return `${index + 1}. ${label}`;
  });

  if (locale === "EL") {
    return `Έχω τα βασικά στοιχεία. Μπορώ να προτείνω αυτές τις διαθέσιμες ώρες:\n${lines.join("\n")}\nΑπαντήστε με τον αριθμό της επιλογής που σας βολεύει για να την επιβεβαιώσω.`;
  }

  return `I have the key details. These appointment times are available:\n${lines.join("\n")}\nReply with the option number that works for you and I’ll confirm it.`;
}

function buildConfirmationReply(slot: BookingSlot, locale: "EN" | "EL") {
  const label = formatSlotRange({
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    timeZone: slot.timezone,
    locale,
  });

  if (locale === "EL") {
    return `Το ραντεβού επιβεβαιώθηκε για ${label}. Η ομάδα θα έχει τα στοιχεία σας πριν τη συνάντηση.`;
  }

  return `Your appointment is confirmed for ${label}. The team will have your details before the meeting.`;
}

function parseSuggestedSlots(value: Prisma.JsonValue, timezone: string): BookingSlot[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const slots = (value as Record<string, unknown>).suggestedSlots;
  if (!Array.isArray(slots)) return [];

  return slots.flatMap((slot) => {
    if (!slot || typeof slot !== "object" || Array.isArray(slot)) return [];
    const record = slot as Record<string, unknown>;
    const startsAt = typeof record.startsAt === "string" ? new Date(record.startsAt) : null;
    const endsAt = typeof record.endsAt === "string" ? new Date(record.endsAt) : null;
    if (!startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
      return [];
    }
    return [
      {
        startsAt,
        endsAt,
        timezone: typeof record.timezone === "string" ? record.timezone : timezone,
        label: typeof record.label === "string" ? record.label : "",
      },
    ];
  });
}

function serializeSlot(slot: BookingSlot) {
  return {
    startsAt: slot.startsAt.toISOString(),
    endsAt: slot.endsAt.toISOString(),
    timezone: slot.timezone,
    label: slot.label,
  };
}

function mergeStructuredData(
  current: Prisma.JsonValue,
  patch: Record<string, unknown>,
) {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {};
  return toJson({ ...base, ...patch });
}

function toJson(value: Record<string, unknown>) {
  return value as Prisma.InputJsonValue;
}
