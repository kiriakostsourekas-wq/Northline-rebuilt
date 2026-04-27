const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function parseClockTime(value: string) {
  const match = value.trim().match(timePattern);
  if (!match) return null;
  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

export function minutesFromClock(value: string) {
  const parsed = parseClockTime(value);
  if (!parsed) return null;
  return parsed.hour * 60 + parsed.minute;
}

export function clockFromMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function startOfZonedDay(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return zonedTimeToUtc(
    {
      year: parts.year,
      month: parts.month,
      day: parts.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

export function addZonedDays(date: Date, days: number, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const localNoon = Date.UTC(parts.year, parts.month - 1, parts.day + days, 12);
  return startOfZonedDay(new Date(localNoon), timeZone);
}

export function getZonedDayOfWeek(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function getZonedDateKey(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const values = Object.fromEntries(
    formatter.formatToParts(date).map((part) => [part.type, part.value]),
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function zonedDateTimeToUtc(input: {
  dateKey: string;
  time: string;
  timeZone: string;
}) {
  const [year, month, day] = input.dateKey.split("-").map(Number);
  const clock = parseClockTime(input.time);
  if (!year || !month || !day || !clock) return null;
  return zonedTimeToUtc(
    {
      year,
      month,
      day,
      hour: clock.hour,
      minute: clock.minute,
      second: 0,
    },
    input.timeZone,
  );
}

export function zonedTimeToUtc(parts: ZonedParts, timeZone: string) {
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  let candidate = new Date(localAsUtc);
  let offset = getTimeZoneOffsetMs(candidate, timeZone);
  candidate = new Date(localAsUtc - offset);
  offset = getTimeZoneOffsetMs(candidate, timeZone);
  return new Date(localAsUtc - offset);
}

export function formatSlotRange(input: {
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
  locale?: "EN" | "EL";
}) {
  const locale = input.locale === "EL" ? "el-GR" : "en-GB";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: input.timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: input.timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  return `${dateFormatter.format(input.startsAt)}, ${timeFormatter.format(input.startsAt)}-${timeFormatter.format(input.endsAt)}`;
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}
