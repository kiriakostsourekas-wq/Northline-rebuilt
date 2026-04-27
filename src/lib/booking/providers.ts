import { createSign } from "node:crypto";
import type { BookingProviderKind } from "@/lib/booking/types";

export type CalendarEventInput = {
  bookingId: string;
  calendarId?: string | null;
  summary: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  customer: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
};

export type CalendarEventResult = {
  provider: BookingProviderKind;
  externalEventId: string;
  joinUrl?: string | null;
};

export type CalendarProvider = {
  provider: BookingProviderKind;
  configured: boolean;
  createEvent(input: CalendarEventInput): Promise<CalendarEventResult>;
  cancelEvent(input: {
    externalEventId: string;
    reason?: string | null;
  }): Promise<void>;
};

export function getCalendarProvider(
  preferredProvider: BookingProviderKind,
): CalendarProvider {
  if (preferredProvider === "GOOGLE_CALENDAR" && hasGoogleCalendarConfig()) {
    return createGoogleCalendarProvider();
  }

  if (preferredProvider === "GOOGLE_CALENDAR") {
    console.info("northline.booking.provider_fallback", {
      preferredProvider,
      fallbackProvider: "LOCAL_MOCK",
      reason: "Google Calendar credentials are not configured.",
    });
  }

  return createLocalCalendarProvider();
}

export function createLocalCalendarProvider(): CalendarProvider {
  return {
    provider: "LOCAL_MOCK",
    configured: true,
    async createEvent(input) {
      console.info("northline.booking.local_event_created", {
        bookingId: input.bookingId,
        startsAt: input.startsAt.toISOString(),
        endsAt: input.endsAt.toISOString(),
      });

      return {
        provider: "LOCAL_MOCK",
        externalEventId: `local-${input.bookingId}`,
      };
    },
    async cancelEvent(input) {
      console.info("northline.booking.local_event_cancelled", {
        externalEventId: input.externalEventId,
        reason: input.reason ?? null,
      });
    },
  };
}

export function createGoogleCalendarProvider(): CalendarProvider {
  return {
    provider: "GOOGLE_CALENDAR",
    configured: hasGoogleCalendarConfig(),
    async createEvent(input) {
      if (!hasGoogleCalendarConfig()) {
        throw new Error("Google Calendar credentials are not configured.");
      }

      const accessToken = await requestGoogleAccessToken();
      const calendarId = encodeURIComponent(input.calendarId || "primary");
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: input.summary,
            description: input.description ?? undefined,
            start: {
              dateTime: input.startsAt.toISOString(),
              timeZone: input.timezone,
            },
            end: {
              dateTime: input.endsAt.toISOString(),
              timeZone: input.timezone,
            },
            attendees: input.customer.email
              ? [{ email: input.customer.email, displayName: input.customer.name ?? undefined }]
              : undefined,
            extendedProperties: {
              private: {
                northlineBookingId: input.bookingId,
              },
            },
          }),
        },
      );
      const payload = await readGoogleResponse(response);
      const eventId = stringField(payload, "id");
      if (!eventId) {
        throw new Error("Google Calendar did not return an event id.");
      }

      console.info("northline.booking.google_event_created", {
        bookingId: input.bookingId,
        calendarId: input.calendarId ?? "primary",
        eventId,
      });

      return {
        provider: "GOOGLE_CALENDAR",
        externalEventId: eventId,
        joinUrl: stringField(payload, "hangoutLink") ?? stringField(payload, "htmlLink"),
      };
    },
    async cancelEvent(input) {
      if (!hasGoogleCalendarConfig()) {
        throw new Error("Google Calendar credentials are not configured.");
      }

      const accessToken = await requestGoogleAccessToken();
      const calendarId = encodeURIComponent(
        process.env.GOOGLE_CALENDAR_DEFAULT_CALENDAR_ID || "primary",
      );
      const eventId = encodeURIComponent(input.externalEventId);
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      if (!response.ok && response.status !== 404) {
        await readGoogleResponse(response);
      }

      console.info("northline.booking.google_event_cancelled", {
        externalEventId: input.externalEventId,
      });
    },
  };
}

function hasGoogleCalendarConfig() {
  return Boolean(
    process.env.GOOGLE_CALENDAR_CLIENT_EMAIL &&
      process.env.GOOGLE_CALENDAR_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_PROJECT_ID,
  );
}

async function requestGoogleAccessToken() {
  const assertion = signGoogleJwt();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const payload = await readGoogleResponse(response);
  const accessToken = stringField(payload, "access_token");
  if (!accessToken) {
    throw new Error("Google OAuth token response did not include access_token.");
  }
  return accessToken;
}

function signGoogleJwt() {
  const clientEmail = process.env.GOOGLE_CALENDAR_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_CALENDAR_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Google Calendar credentials are incomplete.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/calendar.events",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(privateKey);
  return `${unsigned}.${base64Url(signature)}`;
}

async function readGoogleResponse(response: Response) {
  const text = await response.text();
  const payload = text ? safeJson(text) : {};
  if (!response.ok) {
    const message =
      stringField(payload, "error_description") ??
      stringField(payload, "error") ??
      `Google Calendar request failed with ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

function safeJson(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function stringField(value: Record<string, unknown>, key: string) {
  const field = value[key];
  return typeof field === "string" ? field : null;
}

function base64Url(value: string | Buffer) {
  const buffer = typeof value === "string" ? Buffer.from(value) : value;
  return buffer
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "");
}
