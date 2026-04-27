export type BookingProviderKind = "LOCAL_MOCK" | "GOOGLE_CALENDAR";

export type BookingStatusValue =
  | "REQUESTED"
  | "SLOT_SUGGESTED"
  | "PENDING_CONFIRMATION"
  | "CONFIRMED"
  | "RESCHEDULE_REQUESTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type BookingSettingsSnapshot = {
  timezone: string;
  provider: BookingProviderKind;
  calendarId?: string | null;
  slotIncrementMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  autoConfirm: boolean;
};

export type MeetingTypeSnapshot = {
  id?: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  isActive: boolean;
};

export type AvailabilityWindowSnapshot = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
};

export type BookingBlackoutSnapshot = {
  id?: string;
  startsAt: Date;
  endsAt: Date;
  reason?: string | null;
};

export type BookingConflictSnapshot = {
  id?: string;
  startsAt: Date;
  endsAt: Date;
  status?: BookingStatusValue | string;
};

export type BookingSlot = {
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  label: string;
};

export type BookingCustomer = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  locale?: "EN" | "EL" | null;
};

export type BookingRecordSummary = {
  customer: BookingCustomer;
  meetingTypeName: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  timezone: string;
  serviceInterest?: string | null;
  source?: string | null;
};
