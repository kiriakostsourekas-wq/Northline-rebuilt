import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildExportIdempotencyKey,
  buildLeadExportPayload,
  encryptSecret,
  hashPayload,
  nextRetryAt,
  shouldRetry,
  webhookAdapter,
} from "@/lib/destinations";

describe("destination export pipeline utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds stable idempotency keys and payload hashes", () => {
    const key = buildExportIdempotencyKey({
      organizationId: "org_1",
      leadId: "lead_1",
      conversationId: "conv_1",
      eventType: "LEAD_QUALIFIED",
    });
    const payload = makePayload(key);

    expect(key).toBe(
      "northline:lead-export:org_1:LEAD_QUALIFIED:lead_1:conv_1",
    );
    expect(hashPayload(payload)).toBe(hashPayload({ ...payload }));
  });

  it("maps lead, conversation, booking, channel, and workspace data into one payload", () => {
    const key = buildExportIdempotencyKey({
      organizationId: "org_1",
      leadId: "lead_1",
      bookingRequestId: "booking_1",
      eventType: "BOOKING_CONFIRMED",
    });
    const payload = makePayload(key, "BOOKING_CONFIRMED");

    expect(payload.workspace).toMatchObject({
      id: "org_1",
      primaryMarket: "GR",
      languageMode: "BILINGUAL",
    });
    expect(payload.lead).toMatchObject({
      id: "lead_1",
      email: "maria@example.com",
      serviceInterest: "AI sales assistant setup",
    });
    expect(payload.sourceChannel?.type).toBe("WEBSITE_CHAT");
    expect(payload.conversation?.summary).toContain("Qualified");
    expect(payload.booking?.status).toBe("CONFIRMED");
  });

  it("delivers webhook payloads with idempotency and signature headers", async () => {
    const fetchMock = vi.fn(
      async (input: string | URL | Request, init?: RequestInit) => {
        void input;
        void init;
        return new Response("ok", { status: 200 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const key = "export-key";
    const result = await webhookAdapter.deliver({
      destination: {
        id: "dest_1",
        organizationId: "org_1",
        name: "CRM webhook",
        provider: "WEBHOOK",
        endpointUrl: "https://example.com/webhook",
        secretEncrypted: encryptSecret("shared-secret"),
        headers: { "X-Test": "yes" },
        maxAttempts: 3,
      },
      payload: makePayload(key),
      exportId: "export_1",
      idempotencyKey: key,
    });

    expect(result.status).toBe("DELIVERED");
    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as
      | (RequestInit & { headers: Record<string, string> })
      | undefined;
    expect(init?.headers["X-Northline-Idempotency-Key"]).toBe(key);
    expect(init?.headers["X-Northline-Signature"]).toMatch(/^sha256=/);
    expect(init?.headers["X-Test"]).toBe("yes");
  });

  it("classifies retryable webhook failures and retry timing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response("busy for maria@example.com with token=secret", {
          status: 503,
        }),
      ),
    );

    const result = await webhookAdapter.deliver({
      destination: {
        id: "dest_1",
        organizationId: "org_1",
        name: "CRM webhook",
        provider: "WEBHOOK",
        endpointUrl: "https://example.com/webhook",
        maxAttempts: 3,
      },
      payload: makePayload("export-key"),
      exportId: "export_1",
      idempotencyKey: "export-key",
    });

    expect(result.status).toBe("RETRYING");
    expect(result.retryable).toBe(true);
    expect(result.responseBody).toBe("busy for [redacted] with token=[redacted]");
    expect(shouldRetry({ retryable: true, attemptNumber: 2, maxAttempts: 3 }))
      .toBe(true);
    expect(shouldRetry({ retryable: true, attemptNumber: 3, maxAttempts: 3 }))
      .toBe(false);
    expect(nextRetryAt({ attemptNumber: 2, now: new Date(0) }).toISOString())
      .toBe("1970-01-01T00:02:00.000Z");
  });
});

function makePayload(
  idempotencyKey: string,
  eventType: "LEAD_QUALIFIED" | "BOOKING_CONFIRMED" = "LEAD_QUALIFIED",
) {
  return buildLeadExportPayload({
    eventType,
    idempotencyKey,
    exportedAt: new Date("2026-04-26T10:00:00.000Z"),
    workspace: {
      id: "org_1",
      name: "Northline Demo",
      slug: "northline-demo",
      defaultLocale: "EN",
      languageMode: "BILINGUAL",
      primaryMarket: "GR",
      planTier: "PREVIEW",
    },
    lead: {
      id: "lead_1",
      status: "SALES_READY",
      score: 88,
      qualificationConfidence: 92,
      fullName: "Maria Demo",
      email: "maria@example.com",
      phone: "+306901234567",
      preferredContactMethod: "email",
      serviceInterest: "AI sales assistant setup",
      budget: "1200 EUR",
      location: "Athens",
      urgency: "this week",
      bookingIntent: true,
      preferredLocale: "EN",
      summary: "Qualified lead with booking intent.",
      qualificationData: { missingFields: [] },
      sourceChannel: {
        id: "channel_1",
        type: "WEBSITE_CHAT",
        displayName: "Website chat",
      },
      contactIdentities: [],
      createdAt: new Date("2026-04-26T09:00:00.000Z"),
      updatedAt: new Date("2026-04-26T09:15:00.000Z"),
    },
    conversation: {
      id: "conv_1",
      status: "WAITING_ON_BUSINESS",
      summary: "Qualified conversation summary.",
      internalNotes: "CRM export notes.",
      lastMessageAt: new Date("2026-04-26T09:14:00.000Z"),
      lastInboundAt: new Date("2026-04-26T09:10:00.000Z"),
      lastOutboundAt: new Date("2026-04-26T09:14:00.000Z"),
      externalThreadId: "thread_1",
      engineState: { stage: "BOOKING_READY" },
      channel: {
        id: "channel_1",
        type: "WEBSITE_CHAT",
        displayName: "Website chat",
      },
    },
    booking: {
      id: "booking_1",
      status: "CONFIRMED",
      startsAt: new Date("2026-04-27T06:00:00.000Z"),
      endsAt: new Date("2026-04-27T06:30:00.000Z"),
      timezone: "Europe/Athens",
      provider: "LOCAL_MOCK",
      externalEventId: "local-booking_1",
      customerName: "Maria Demo",
      customerEmail: "maria@example.com",
      customerPhone: "+306901234567",
      summary: "Customer: Maria Demo / Meeting: Discovery call",
      confirmedAt: new Date("2026-04-26T09:20:00.000Z"),
      meetingType: { name: "Discovery call" },
    },
  });
}
