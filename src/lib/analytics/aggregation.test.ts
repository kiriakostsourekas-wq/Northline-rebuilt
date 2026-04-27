import { describe, expect, it } from "vitest";
import { buildOperationalAnalytics } from "@/lib/analytics/aggregation";
import type { AnalyticsConversationRecord } from "@/lib/analytics/types";

describe("operational analytics aggregation", () => {
  it("computes core funnel, response, handoff, language, and export metrics", () => {
    const report = buildOperationalAnalytics({
      dateRange: range(),
      conversations: [
        conversation({
          id: "c1",
          channelType: "WEBSITE_CHAT",
          leadId: "l1",
          leadStatus: "QUALIFIED",
          messages: [
            inbound("m1", "ENGLISH", at(0)),
            outbound("m2", "ASSISTANT", at(45_000)),
          ],
        }),
        conversation({
          id: "c2",
          channelType: "WHATSAPP",
          leadId: "l2",
          leadStatus: "NEW",
          messages: [inbound("m3", "GREEK", at(120_000))],
          handoffs: [
            {
              id: "h1",
              status: "REQUESTED",
              reason: "Low-confidence or fallback state needs operator review.",
              createdAt: at(150_000),
            },
          ],
        }),
      ],
      bookings: [
        {
          id: "b1",
          status: "CONFIRMED",
          createdAt: at(180_000),
          confirmedAt: at(210_000),
        },
      ],
      exports: [
        {
          id: "e1",
          status: "DELIVERED",
          eventType: "LEAD_QUALIFIED",
          createdAt: at(240_000),
          deliveredAt: at(250_000),
        },
        {
          id: "e2",
          status: "FAILED",
          eventType: "LEAD_BOOKED",
          createdAt: at(260_000),
          lastError: "Webhook returned 500.",
        },
      ],
      deliveryAttempts: [],
    });

    expect(report.summary).toMatchObject({
      inboundConversations: 2,
      averageFirstResponseMs: 45_000,
      qualifiedLeads: 1,
      bookedAppointments: 1,
      handoffRate: 50,
      unansweredOrFailedCases: 2,
      exportDelivered: 1,
      exportFailed: 1,
    });
    expect(report.channelMix.map((item) => item.label)).toEqual([
      "website chat",
      "whatsapp",
    ]);
    expect(report.languageMix).toEqual([
      { label: "english", value: 1, percentage: 50 },
      { label: "greek", value: 1, percentage: 50 },
    ]);
    expect(report.topReasons[0]).toMatchObject({
      reason: "Low-confidence or fallback state needs operator review.",
      source: "Handoff",
    });
  });

  it("counts human replies as operator intervention and not unanswered", () => {
    const report = buildOperationalAnalytics({
      dateRange: range(),
      conversations: [
        conversation({
          id: "c1",
          messages: [
            inbound("m1", "MIXED", at(0)),
            outbound("m2", "HUMAN", at(30_000)),
          ],
        }),
      ],
      bookings: [],
      exports: [],
      deliveryAttempts: [],
    });

    expect(report.summary.operatorInterventionRate).toBe(100);
    expect(report.summary.unansweredOrFailedCases).toBe(0);
    expect(report.summary.firstResponseCoverage).toBe(100);
  });

  it("does not invent response-time metrics when no outbound response exists", () => {
    const report = buildOperationalAnalytics({
      dateRange: range(),
      conversations: [
        conversation({
          id: "c1",
          messages: [inbound("m1", "UNKNOWN", at(0))],
        }),
      ],
      bookings: [],
      exports: [],
      deliveryAttempts: [],
    });

    expect(report.summary.averageFirstResponseMs).toBeNull();
    expect(report.summary.firstResponseCoverage).toBe(0);
    expect(report.summary.unansweredOrFailedCases).toBe(1);
  });
});

function range() {
  return { from: at(0), to: at(1_000_000) };
}

function conversation(
  overrides: Partial<AnalyticsConversationRecord>,
): AnalyticsConversationRecord {
  return {
    id: "conversation",
    status: "OPEN",
    createdAt: at(0),
    lastInboundAt: at(0),
    lastOutboundAt: null,
    channelType: "WEBSITE_CHAT",
    channelDisplayName: null,
    leadId: null,
    leadStatus: "NEW",
    leadScore: 0,
    messages: [],
    handoffs: [],
    handoffEvents: [],
    ...overrides,
  };
}

function inbound(id: string, detectedLanguage: string, createdAt: Date) {
  return {
    id,
    direction: "INBOUND",
    senderType: "LEAD",
    detectedLanguage,
    createdAt,
  };
}

function outbound(id: string, senderType: string, createdAt: Date) {
  return {
    id,
    direction: "OUTBOUND",
    senderType,
    detectedLanguage: "UNKNOWN",
    createdAt,
    sentAt: createdAt,
  };
}

function at(offsetMs: number) {
  return new Date(Date.UTC(2026, 3, 26, 9, 0, 0) + offsetMs);
}
