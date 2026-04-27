export type DestinationEventType =
  | "LEAD_QUALIFIED"
  | "LEAD_BOOKED"
  | "BOOKING_CONFIRMED"
  | "MANUAL_REPLAY";

export type DestinationProviderValue =
  | "WEBHOOK"
  | "HUBSPOT"
  | "SALESFORCE"
  | "PIPEDRIVE"
  | "CUSTOM_CRM";

export type DeliveryStatusValue =
  | "PENDING"
  | "DELIVERED"
  | "FAILED"
  | "RETRYING"
  | "SKIPPED";

export type DestinationSnapshot = {
  id: string;
  organizationId: string;
  name: string;
  provider: DestinationProviderValue;
  endpointUrl?: string | null;
  secretEncrypted?: string | null;
  headers?: Record<string, string> | null;
  maxAttempts: number;
};

export type ExportPayload = {
  version: "northline.lead_export.v1";
  event: {
    type: DestinationEventType;
    idempotencyKey: string;
    exportedAt: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
    defaultLocale: "EN" | "EL";
    languageMode: string;
    primaryMarket: string;
    planTier: string;
  };
  lead: {
    id: string;
    status: string;
    score: number;
    qualificationConfidence: number;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    preferredContactMethod: string | null;
    serviceInterest: string | null;
    budget: string | null;
    location: string | null;
    urgency: string | null;
    bookingIntent: boolean;
    preferredLocale: "EN" | "EL" | null;
    summary: string | null;
    qualificationData: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  contactIdentities: Array<{
    channelType: string;
    externalContactId: string;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    handle: string | null;
    confidence: number;
  }>;
  sourceChannel: {
    id: string;
    type: string;
    displayName: string;
  } | null;
  conversation: {
    id: string;
    status: string;
    summary: string | null;
    internalNotes: string | null;
    lastMessageAt: string | null;
    lastInboundAt: string | null;
    lastOutboundAt: string | null;
    externalThreadId: string | null;
    metadata: Record<string, unknown>;
    messages?: Array<{
      direction: string;
      senderType: string;
      body: string;
      detectedLanguage: string;
      createdAt: string;
    }>;
  } | null;
  booking: {
    id: string;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
    timezone: string;
    meetingTypeName: string | null;
    provider: string;
    externalEventId: string | null;
    customerName: string | null;
    customerEmail: string | null;
    customerPhone: string | null;
    summary: string | null;
    confirmedAt: string | null;
  } | null;
  timestamps: {
    exportedAt: string;
    leadCreatedAt: string;
    leadUpdatedAt: string;
  };
};

export type WebhookDeliveryResult = {
  status: DeliveryStatusValue;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  retryable: boolean;
};
