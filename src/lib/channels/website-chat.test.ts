import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { websiteChatAdapter } from "@/lib/channels/adapters/website-chat";

describe("website chat adapter", () => {
  afterEach(() => {
    delete process.env.NORTHLINE_WEBSITE_CHAT_SECRET;
  });

  it("normalizes local website chat payloads", () => {
    const event = websiteChatAdapter.normalizeInbound({
      organizationId: "org_1",
      headers: new Headers(),
      payload: {
        eventId: "event_1",
        messageId: "message_1",
        visitorId: "visitor_1",
        threadId: "thread_1",
        widgetId: "widget_1",
        message: "I want pricing for a team plan.",
        email: "LEAD@EXAMPLE.COM",
        name: "Maria",
        locale: "el-GR",
      },
    });

    expect(event).toMatchObject({
      organizationId: "org_1",
      provider: "website_chat",
      channelType: "WEBSITE_CHAT",
      externalAccountId: "widget_1",
      externalEventId: "event_1",
      externalThreadId: "thread_1",
      contact: {
        externalContactId: "visitor_1",
        email: "lead@example.com",
        displayName: "Maria",
      },
      message: {
        externalMessageId: "message_1",
        body: "I want pricing for a team plan.",
        locale: "EL",
      },
    });
  });

  it("allows local simulator traffic when no shared secret is configured", () => {
    expect(
      websiteChatAdapter.verifyWebhook({
        headers: new Headers(),
        payload: {},
      }),
    ).toEqual({ ok: true });
  });

  it("verifies signed website chat webhook payloads", () => {
    process.env.NORTHLINE_WEBSITE_CHAT_SECRET = "shared-secret";
    const rawBody = JSON.stringify({ message: "hello" });
    const signature = `sha256=${createHmac("sha256", "shared-secret")
      .update(rawBody)
      .digest("hex")}`;

    expect(
      websiteChatAdapter.verifyWebhook({
        headers: new Headers({ "x-northline-signature": signature }),
        payload: { message: "hello" },
        rawBody,
      }),
    ).toEqual({ ok: true });
    expect(
      websiteChatAdapter.verifyWebhook({
        headers: new Headers({ "x-northline-signature": "sha256=bad" }),
        payload: { message: "hello" },
        rawBody,
      }),
    ).toMatchObject({ ok: false, status: 401 });
  });
});
