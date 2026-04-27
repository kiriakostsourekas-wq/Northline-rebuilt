export type AnalyticsDateRange = {
  from: Date;
  to: Date;
};

export type AnalyticsMessageRecord = {
  id: string;
  direction: "INBOUND" | "OUTBOUND" | string;
  senderType: "LEAD" | "ASSISTANT" | "HUMAN" | "SYSTEM" | string;
  detectedLanguage: string;
  createdAt: Date;
  sentAt?: Date | null;
  failedAt?: Date | null;
  errorMessage?: string | null;
};

export type AnalyticsConversationRecord = {
  id: string;
  status: string;
  createdAt: Date;
  lastInboundAt?: Date | null;
  lastOutboundAt?: Date | null;
  channelType?: string | null;
  channelDisplayName?: string | null;
  leadId?: string | null;
  leadStatus?: string | null;
  leadScore?: number | null;
  messages: AnalyticsMessageRecord[];
  handoffs: Array<{
    id: string;
    status: string;
    reason: string;
    createdAt: Date;
  }>;
  handoffEvents: Array<{
    id: string;
    eventType: string;
    reason?: string | null;
    note?: string | null;
    createdAt: Date;
    actorUserId?: string | null;
  }>;
};

export type AnalyticsBookingRecord = {
  id: string;
  status: string;
  createdAt: Date;
  confirmedAt?: Date | null;
  conversationId?: string | null;
};

export type AnalyticsExportRecord = {
  id: string;
  status: string;
  eventType: string;
  createdAt: Date;
  deliveredAt?: Date | null;
  lastError?: string | null;
};

export type AnalyticsDeliveryAttemptRecord = {
  id: string;
  status: string;
  createdAt: Date;
  errorMessage?: string | null;
};

export type AnalyticsAggregationInput = {
  dateRange: AnalyticsDateRange;
  conversations: AnalyticsConversationRecord[];
  bookings: AnalyticsBookingRecord[];
  exports: AnalyticsExportRecord[];
  deliveryAttempts: AnalyticsDeliveryAttemptRecord[];
};

export type AnalyticsReport = {
  dateRange: AnalyticsDateRange;
  summary: {
    inboundConversations: number;
    averageFirstResponseMs: number | null;
    firstResponseCoverage: number;
    qualifiedLeads: number;
    bookedAppointments: number;
    handoffRate: number;
    unansweredOrFailedCases: number;
    operatorInterventionRate: number;
    exportDelivered: number;
    exportFailed: number;
  };
  funnel: Array<{
    key: string;
    label: string;
    value: number;
    denominator: number;
  }>;
  channelMix: Array<{ label: string; value: number; percentage: number }>;
  languageMix: Array<{ label: string; value: number; percentage: number }>;
  breakpoints: Array<{
    key: string;
    label: string;
    value: number;
    detail: string;
    severity: "good" | "watch" | "risk";
  }>;
  topReasons: Array<{ reason: string; count: number; source: string }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    detail: string;
    at: Date;
    severity: "neutral" | "success" | "warning" | "risk";
  }>;
};
