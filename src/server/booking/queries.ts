import { formatSlotRange, generateAvailableSlots } from "@/lib/booking";
import { ensureBookingDefaults } from "@/server/booking/service";
import { getPrismaClient } from "@/server/db";

export type BookingPageData = Awaited<ReturnType<typeof getBookingPageData>>;

export async function getBookingPageData(input: {
  organizationId: string;
  selectedBookingId?: string | null;
}) {
  const prisma = getPrismaClient();
  const defaults = await ensureBookingDefaults({
    organizationId: input.organizationId,
    prisma,
  });
  const [meetingTypes, blackouts, appointments, selectedBooking, blockingBookings] =
    await Promise.all([
    prisma.meetingType.findMany({
      where: { organizationId: input.organizationId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.bookingBlackout.findMany({
      where: { organizationId: input.organizationId },
      orderBy: { startsAt: "asc" },
      take: 20,
    }),
    prisma.bookingRequest.findMany({
      where: { organizationId: input.organizationId },
      include: {
        lead: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            serviceInterest: true,
            urgency: true,
          },
        },
        meetingType: { select: { id: true, name: true, durationMinutes: true } },
      },
      orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
    input.selectedBookingId
      ? prisma.bookingRequest.findFirst({
          where: {
            id: input.selectedBookingId,
            organizationId: input.organizationId,
          },
          include: {
            lead: true,
            meetingType: true,
            conversation: { select: { id: true, status: true, summary: true } },
            events: { orderBy: { createdAt: "desc" }, take: 12 },
          },
        })
      : null,
    prisma.bookingRequest.findMany({
      where: {
        organizationId: input.organizationId,
        status: { in: ["PENDING_CONFIRMATION", "CONFIRMED", "RESCHEDULE_REQUESTED"] },
        startsAt: { not: null },
        endsAt: { not: null },
      },
      select: { id: true, startsAt: true, endsAt: true, status: true },
    }),
    ]);
  const fallbackSelectedBooking =
    selectedBooking ??
    (appointments[0]
      ? await prisma.bookingRequest.findFirst({
          where: {
            id: appointments[0].id,
            organizationId: input.organizationId,
          },
          include: {
            lead: true,
            meetingType: true,
            conversation: { select: { id: true, status: true, summary: true } },
            events: { orderBy: { createdAt: "desc" }, take: 12 },
          },
        })
      : null);
  const activeMeetingType =
    meetingTypes.find((meetingType) => meetingType.isActive) ??
    defaults.defaultMeetingType;
  const previewSlots = generateAvailableSlots({
    settings: defaults.settings,
    meetingType: activeMeetingType,
    availabilityWindows: defaults.settings.availabilityWindows,
    blackouts,
    existingBookings: blockingBookings.flatMap((booking) =>
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
    limit: 5,
  });

  return {
    settings: defaults.settings,
    meetingTypes,
    blackouts,
    appointments,
    selectedBooking: fallbackSelectedBooking,
    previewSlots: previewSlots.map((slot) => ({
      ...slot,
      label: formatSlotRange({
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timeZone: slot.timezone,
      }),
    })),
  };
}
