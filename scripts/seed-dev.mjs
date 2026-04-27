import "dotenv/config";
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const { Client } = pg;
const scryptAsync = promisify(scrypt);

const seed = {
  organizationId: "seed_org_northline_preview",
  ownerId: "seed_user_owner",
  onboardingId: "seed_onboarding",
  profileId: "seed_business_profile",
  channelId: "seed_website_chat_channel",
  bookingSettingsId: "seed_booking_settings",
  meetingTypeId: "seed_intro_meeting",
  organizationName: process.env.SEED_WORKSPACE_NAME || "Northline Preview Workspace",
  organizationSlug: process.env.SEED_WORKSPACE_SLUG || "northline-preview",
  ownerEmail: (process.env.SEED_OWNER_EMAIL || "owner@northline.local").toLowerCase(),
  ownerPassword: process.env.SEED_OWNER_PASSWORD || "Northline123",
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed development data.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    await client.query("BEGIN");
    const passwordHash = await hashPassword(seed.ownerPassword);

    await client.query(
      `
      INSERT INTO "Organization" (
        "id", "name", "slug", "websiteUrl", "primaryMarket",
        "defaultLocale", "languageMode", "planTier", "billingStatus",
        "billingEmail", "updatedAt"
      )
      VALUES (
        $1, $2, $3, 'https://preview.northline.local', 'GR',
        'EN', 'BILINGUAL', 'PREVIEW', 'NOT_CONFIGURED',
        $4, NOW()
      )
      ON CONFLICT ("slug") DO UPDATE SET
        "name" = EXCLUDED."name",
        "billingEmail" = EXCLUDED."billingEmail",
        "updatedAt" = NOW()
      `,
      [
        seed.organizationId,
        seed.organizationName,
        seed.organizationSlug,
        seed.ownerEmail,
      ],
    );

    await client.query(
      `
      INSERT INTO "User" (
        "id", "organizationId", "email", "passwordHash", "name", "role",
        "emailVerifiedAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, 'Preview Owner', 'OWNER', NOW(), NOW())
      ON CONFLICT ("email") DO UPDATE SET
        "organizationId" = EXCLUDED."organizationId",
        "passwordHash" = EXCLUDED."passwordHash",
        "role" = 'OWNER',
        "emailVerifiedAt" = NOW(),
        "updatedAt" = NOW()
      `,
      [seed.ownerId, seed.organizationId, seed.ownerEmail, passwordHash],
    );

    await client.query(
      `
      INSERT INTO "OnboardingState" (
        "id", "organizationId", "currentStep", "languageMode",
        "businessBasics", "businessDescription", "desiredChannels",
        "leadFields", "bookingPreferences", "integrationPreference",
        "completedAt", "updatedAt"
      )
      VALUES (
        $1, $2, 'COMPLETE', 'BILINGUAL',
        $3::jsonb, $4, ARRAY['WEBSITE_CHAT']::"ChannelType"[],
        ARRAY['name', 'email', 'phone', 'service_interest', 'timeline']::TEXT[],
        $5::jsonb, $6::jsonb, NOW(), NOW()
      )
      ON CONFLICT ("organizationId") DO UPDATE SET
        "currentStep" = 'COMPLETE',
        "languageMode" = 'BILINGUAL',
        "businessBasics" = EXCLUDED."businessBasics",
        "businessDescription" = EXCLUDED."businessDescription",
        "desiredChannels" = EXCLUDED."desiredChannels",
        "leadFields" = EXCLUDED."leadFields",
        "bookingPreferences" = EXCLUDED."bookingPreferences",
        "integrationPreference" = EXCLUDED."integrationPreference",
        "completedAt" = NOW(),
        "updatedAt" = NOW()
      `,
      [
        seed.onboardingId,
        seed.organizationId,
        JSON.stringify({
          businessName: seed.organizationName,
          website: "https://preview.northline.local",
          primaryMarket: "Greece",
        }),
        "A preview SMB workspace for testing Northline lead capture, qualification, booking, and handoff workflows.",
        JSON.stringify({ timezone: "Europe/Athens", autoConfirm: false }),
        JSON.stringify({ destination: "webhook", configured: false }),
      ],
    );

    await client.query(
      `
      INSERT INTO "BusinessProfile" (
        "id", "organizationId", "displayName", "description",
        "services", "serviceAreas", "languages", "timezone", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4,
        ARRAY['Lead qualification', 'Demo booking', 'Human handoff']::TEXT[],
        ARRAY['Athens', 'Thessaloniki', 'Greece']::TEXT[],
        ARRAY['EN', 'EL']::"Locale"[],
        'Europe/Athens',
        NOW()
      )
      ON CONFLICT ("organizationId") DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "description" = EXCLUDED."description",
        "services" = EXCLUDED."services",
        "serviceAreas" = EXCLUDED."serviceAreas",
        "languages" = EXCLUDED."languages",
        "timezone" = EXCLUDED."timezone",
        "updatedAt" = NOW()
      `,
      [
        seed.profileId,
        seed.organizationId,
        seed.organizationName,
        "Preview workspace configured with Greek and English lead handling examples.",
      ],
    );

    await client.query(
      `
      INSERT INTO "Channel" (
        "id", "organizationId", "type", "displayName",
        "externalAccountId", "status", "settings", "updatedAt"
      )
      VALUES (
        $1, $2, 'WEBSITE_CHAT', 'Preview website chat',
        'local-preview-widget', 'ACTIVE', $3::jsonb, NOW()
      )
      ON CONFLICT ("organizationId", "type", "externalAccountId") DO UPDATE SET
        "displayName" = EXCLUDED."displayName",
        "status" = 'ACTIVE',
        "settings" = EXCLUDED."settings",
        "updatedAt" = NOW()
      `,
      [
        seed.channelId,
        seed.organizationId,
        JSON.stringify({ simulator: true, source: "seed-dev" }),
      ],
    );

    await seedBooking(client);
    await seedKnowledge(client);
    await seedDemoOperations(client);

    await client.query("COMMIT");
    console.log("Seeded Northline development workspace.");
    console.log(`Workspace slug: ${seed.organizationSlug}`);
    console.log(`Owner email: ${seed.ownerEmail}`);
    console.log(`Owner password: ${seed.ownerPassword}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

async function seedBooking(client) {
  await client.query(
    `
    INSERT INTO "BookingSettings" (
      "id", "organizationId", "provider", "timezone",
      "slotIncrementMinutes", "minNoticeMinutes", "maxAdvanceDays",
      "autoConfirm", "confirmationMode", "updatedAt"
    )
    VALUES (
      $1, $2, 'LOCAL_MOCK', 'Europe/Athens',
      30, 120, 30, false, 'CONFIRM_CONTACT_AND_SLOT', NOW()
    )
    ON CONFLICT ("organizationId") DO UPDATE SET
      "provider" = 'LOCAL_MOCK',
      "timezone" = 'Europe/Athens',
      "slotIncrementMinutes" = 30,
      "minNoticeMinutes" = 120,
      "maxAdvanceDays" = 30,
      "autoConfirm" = false,
      "confirmationMode" = 'CONFIRM_CONTACT_AND_SLOT',
      "updatedAt" = NOW()
    `,
    [seed.bookingSettingsId, seed.organizationId],
  );

  await client.query(
    `
    INSERT INTO "MeetingType" (
      "id", "organizationId", "name", "description",
      "durationMinutes", "bufferBeforeMinutes", "bufferAfterMinutes",
      "isActive", "sortOrder", "updatedAt"
    )
    VALUES (
      $1, $2, 'Intro call', 'Initial qualified-lead call',
      30, 0, 15, true, 1, NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "description" = EXCLUDED."description",
      "durationMinutes" = EXCLUDED."durationMinutes",
      "bufferAfterMinutes" = EXCLUDED."bufferAfterMinutes",
      "isActive" = true,
      "updatedAt" = NOW()
    `,
    [seed.meetingTypeId, seed.organizationId],
  );

  const weekdays = [
    ["seed_availability_monday", 1],
    ["seed_availability_tuesday", 2],
    ["seed_availability_wednesday", 3],
    ["seed_availability_thursday", 4],
    ["seed_availability_friday", 5],
  ];

  for (const [id, dayOfWeek] of weekdays) {
    await client.query(
      `
      INSERT INTO "AvailabilityWindow" (
        "id", "bookingSettingsId", "dayOfWeek", "startTime",
        "endTime", "isActive", "updatedAt"
      )
      VALUES ($1, $2, $3, '09:30', '17:30', true, NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "dayOfWeek" = EXCLUDED."dayOfWeek",
        "startTime" = EXCLUDED."startTime",
        "endTime" = EXCLUDED."endTime",
        "isActive" = true,
        "updatedAt" = NOW()
      `,
      [id, seed.bookingSettingsId, dayOfWeek],
    );
  }
}

async function seedKnowledge(client) {
  const items = [
    {
      id: "seed_context_profile",
      section: "BUSINESS_PROFILE",
      locale: "EN",
      title: "Business profile",
      rawText:
        "Northline Preview Workspace helps businesses respond to inbound leads, qualify interest, book meetings, and hand off complex cases to an operator.",
      structuredData: { businessType: "B2B service", languages: ["EN", "EL"] },
      sortOrder: 1,
    },
    {
      id: "seed_context_services",
      section: "SERVICES",
      locale: "EN",
      title: "Services",
      rawText:
        "Lead capture, lead qualification, appointment booking, webhook export, and human handoff are available in the preview workspace.",
      structuredData: {
        services: [
          "Lead capture",
          "Lead qualification",
          "Appointment booking",
          "Human handoff",
        ],
      },
      sortOrder: 2,
    },
    {
      id: "seed_context_pricing",
      section: "PRICING",
      locale: "EN",
      title: "Pricing guidance",
      rawText:
        "Pricing is not final in this rebuild. The assistant should collect lead details and route commercial questions to a human.",
      structuredData: { discloseExactPrices: false, routeToHuman: true },
      sortOrder: 3,
    },
    {
      id: "seed_context_hours",
      section: "OPENING_HOURS",
      locale: "EN",
      title: "Working hours",
      rawText:
        "Operators are normally available Monday to Friday, 09:30 to 17:30 Europe/Athens time.",
      structuredData: {
        timezone: "Europe/Athens",
        weekdays: "09:30-17:30",
      },
      sortOrder: 4,
    },
    {
      id: "seed_context_el",
      section: "CUSTOM_NOTES",
      locale: "EL",
      title: "Greek response note",
      rawText:
        "Αν ο πελάτης γράψει στα ελληνικά ή greeklish, η απάντηση πρέπει να είναι σύντομη, φυσική και στα ελληνικά.",
      structuredData: { language: "EL", greeklish: true },
      sortOrder: 5,
    },
  ];

  for (const item of items) {
    await client.query(
      `
      INSERT INTO "BusinessContextItem" (
        "id", "organizationId", "section", "locale", "title",
        "rawText", "normalizedText", "structuredData", "status",
        "sortOrder", "source", "createdByUserId", "updatedByUserId",
        "publishedAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3::"BusinessContextSection", $4::"Locale", $5,
        $6, $7, $8::jsonb, 'PUBLISHED',
        $9, 'SEED', $10, $10, NOW(), NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "title" = EXCLUDED."title",
        "rawText" = EXCLUDED."rawText",
        "normalizedText" = EXCLUDED."normalizedText",
        "structuredData" = EXCLUDED."structuredData",
        "status" = 'PUBLISHED',
        "sortOrder" = EXCLUDED."sortOrder",
        "updatedByUserId" = EXCLUDED."updatedByUserId",
        "publishedAt" = NOW(),
        "updatedAt" = NOW()
      `,
      [
        item.id,
        seed.organizationId,
        item.section,
        item.locale,
        item.title,
        item.rawText,
        normalizeText(item.rawText),
        JSON.stringify(item.structuredData),
        item.sortOrder,
        seed.ownerId,
      ],
    );
  }
}

async function seedDemoOperations(client) {
  const leads = [
    {
      id: "seed_lead_maria",
      fullName: "Maria Papadopoulou",
      email: "maria.papadopoulou@example.gr",
      phone: "+306901234567",
      preferredContactMethod: "email",
      serviceInterest: "AI sales assistant setup",
      budget: "1000-2000 EUR / month",
      location: "Athens",
      urgency: "This month",
      bookingIntent: true,
      status: "SALES_READY",
      score: 86,
      confidence: 92,
      locale: "EN",
      summary:
        "Qualified lead from website chat. Interested in automating inbound messages for a services team and ready to book an intro call.",
    },
    {
      id: "seed_lead_nikos",
      fullName: "Nikos Georgiou",
      email: "nikos.georgiou@example.gr",
      phone: "+306971112233",
      preferredContactMethod: "phone",
      serviceInterest: "Greek and English website chat",
      budget: null,
      location: "Thessaloniki",
      urgency: "Urgent",
      bookingIntent: false,
      status: "HANDED_OFF",
      score: 74,
      confidence: 61,
      locale: "EL",
      summary:
        "Greek-language lead asked for pricing and custom policy details. Human handoff is active because pricing is not approved yet.",
    },
    {
      id: "seed_lead_eleni",
      fullName: "Eleni Markou",
      email: "eleni.markou@example.com",
      phone: null,
      preferredContactMethod: "email",
      serviceInterest: "Webhook export",
      budget: "Not shared",
      location: "Patras",
      urgency: "Next quarter",
      bookingIntent: false,
      status: "QUALIFIED",
      score: 68,
      confidence: 84,
      locale: "EN",
      summary:
        "Qualified but lower urgency. Wants to understand webhook export and internal handoff workflows before booking.",
    },
  ];

  for (const lead of leads) {
    await client.query(
      `
      INSERT INTO "Lead" (
        "id", "organizationId", "sourceChannelId", "ownerId", "fullName",
        "email", "phone", "preferredContactMethod", "serviceInterest",
        "budget", "location", "urgency", "bookingIntent", "freeformNotes",
        "qualificationData", "qualificationConfidence", "lastQualifiedAt",
        "preferredLocale", "status", "score", "consentAt", "consentSource",
        "summary", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15::jsonb, $16, NOW() - INTERVAL '1 day',
        $17::"Locale", $18::"LeadStatus", $19, NOW() - INTERVAL '2 days',
        'website_chat_preview', $20, NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "fullName" = EXCLUDED."fullName",
        "email" = EXCLUDED."email",
        "phone" = EXCLUDED."phone",
        "preferredContactMethod" = EXCLUDED."preferredContactMethod",
        "serviceInterest" = EXCLUDED."serviceInterest",
        "budget" = EXCLUDED."budget",
        "location" = EXCLUDED."location",
        "urgency" = EXCLUDED."urgency",
        "bookingIntent" = EXCLUDED."bookingIntent",
        "qualificationData" = EXCLUDED."qualificationData",
        "qualificationConfidence" = EXCLUDED."qualificationConfidence",
        "preferredLocale" = EXCLUDED."preferredLocale",
        "status" = EXCLUDED."status",
        "score" = EXCLUDED."score",
        "summary" = EXCLUDED."summary",
        "updatedAt" = NOW()
      `,
      [
        lead.id,
        seed.organizationId,
        seed.channelId,
        seed.ownerId,
        lead.fullName,
        lead.email,
        lead.phone,
        lead.preferredContactMethod,
        lead.serviceInterest,
        lead.budget,
        lead.location,
        lead.urgency,
        lead.bookingIntent,
        "Seeded preview lead for demo walkthroughs.",
        JSON.stringify({
          serviceInterest: lead.serviceInterest,
          urgency: lead.urgency,
          location: lead.location,
        }),
        lead.confidence,
        lead.locale,
        lead.status,
        lead.score,
        lead.summary,
      ],
    );
  }

  await seedConversation(client, {
    id: "seed_conv_maria",
    leadId: "seed_lead_maria",
    threadId: "seed_thread_maria",
    status: "WAITING_ON_LEAD",
    aiState: "ACTIVE",
    language: "ENGLISH",
    createdOffset: "2 days",
    summary:
      "Maria wants to evaluate Northline for a 6-person services team. She shared budget, location, and timeline, and accepted an intro-call path.",
    preview: "Great. I can suggest a 30-minute intro call this week.",
    messages: [
      ["seed_msg_maria_1", "INBOUND", "LEAD", "Can Northline qualify leads from our website chat and WhatsApp?", "2 days"],
      ["seed_msg_maria_2", "OUTBOUND", "ASSISTANT", "Yes. For preview, website chat is live locally and messaging channels are scaffolded. What service are you trying to qualify leads for?", "2 days"],
      ["seed_msg_maria_3", "INBOUND", "LEAD", "We need demo booking for a services team in Athens. Budget is around 1000 to 2000 EUR monthly.", "1 day"],
      ["seed_msg_maria_4", "OUTBOUND", "ASSISTANT", "Thanks. You look like a strong fit. I can suggest a 30-minute intro call and include your budget, location, and timeline for the operator.", "1 day"],
    ],
  });

  await seedConversation(client, {
    id: "seed_conv_nikos",
    leadId: "seed_lead_nikos",
    threadId: "seed_thread_nikos",
    status: "WAITING_ON_BUSINESS",
    aiState: "PAUSED",
    pauseReason: "Pricing and policy ambiguity requires a human response.",
    language: "GREEK",
    createdOffset: "1 day",
    summary:
      "Ο Νίκος ζήτησε συγκεκριμένη τιμή και πολιτική για ελληνικά και αγγλικά μηνύματα. Χρειάζεται ανθρώπινη απάντηση πριν συνεχίσει το AI.",
    internalNotes:
      "High-value Greek lead. Confirm pricing guidance before replying.",
    preview: "Θα το προωθήσω σε άνθρωπο της ομάδας για ακριβή απάντηση.",
    messages: [
      ["seed_msg_nikos_1", "INBOUND", "LEAD", "Geia sas, thelo chat se ellinika kai agglika. Poso kostizei?", "1 day"],
      ["seed_msg_nikos_2", "OUTBOUND", "ASSISTANT", "Μπορούμε να υποστηρίξουμε ελληνικά και αγγλικά. Για ακριβή τιμή θα το προωθήσω σε άνθρωπο της ομάδας.", "1 day"],
      ["seed_msg_nikos_3", "INBOUND", "LEAD", "Einai epeigon, theloume apantiseis apo avrio.", "20 hours"],
    ],
  });

  await seedConversation(client, {
    id: "seed_conv_eleni",
    leadId: "seed_lead_eleni",
    threadId: "seed_thread_eleni",
    status: "OPEN",
    aiState: "ACTIVE",
    language: "ENGLISH",
    createdOffset: "6 hours",
    summary:
      "Eleni is qualified for webhook export but has a next-quarter timeline. Keep in nurture unless she asks for booking.",
    preview: "I can show a sample payload and note this for the operator.",
    messages: [
      ["seed_msg_eleni_1", "INBOUND", "LEAD", "We mainly need clean webhook payloads after a lead is qualified.", "6 hours"],
      ["seed_msg_eleni_2", "OUTBOUND", "ASSISTANT", "Northline keeps a stable lead export payload with contact, qualification, source channel, conversation summary, and booking data when present.", "6 hours"],
    ],
  });

  await seedHandoff(client);
  await seedDemoBooking(client);
  await seedDemoExports(client);
}

async function seedConversation(client, conversation) {
  await client.query(
    `
    INSERT INTO "Conversation" (
      "id", "organizationId", "leadId", "channelId", "assignedUserId",
      "externalThreadId", "status", "lastMessageAt", "lastInboundAt",
      "lastOutboundAt", "lastMessagePreview", "summary", "internalNotes",
      "engineState", "aiResponderState", "aiPausedAt", "aiPauseReason",
      "handoffRequestedAt", "createdAt", "updatedAt"
    )
    VALUES (
      $1, $2, $3, $4, $5,
      $6, $7::"ConversationStatus", NOW() - INTERVAL '15 minutes',
      NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '15 minutes',
      $8, $9, $10, $11::jsonb, $12::"AiResponderState",
      CASE WHEN $12 = 'PAUSED' THEN NOW() - INTERVAL '20 hours' ELSE NULL END,
      $13,
      CASE WHEN $12 = 'PAUSED' THEN NOW() - INTERVAL '20 hours' ELSE NULL END,
      NOW() - ($14::INTERVAL), NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "status" = EXCLUDED."status",
      "lastMessageAt" = EXCLUDED."lastMessageAt",
      "lastInboundAt" = EXCLUDED."lastInboundAt",
      "lastOutboundAt" = EXCLUDED."lastOutboundAt",
      "lastMessagePreview" = EXCLUDED."lastMessagePreview",
      "summary" = EXCLUDED."summary",
      "internalNotes" = EXCLUDED."internalNotes",
      "engineState" = EXCLUDED."engineState",
      "aiResponderState" = EXCLUDED."aiResponderState",
      "aiPausedAt" = EXCLUDED."aiPausedAt",
      "aiPauseReason" = EXCLUDED."aiPauseReason",
      "handoffRequestedAt" = EXCLUDED."handoffRequestedAt",
      "updatedAt" = NOW()
    `,
    [
      conversation.id,
      seed.organizationId,
      conversation.leadId,
      seed.channelId,
      conversation.aiState === "PAUSED" ? seed.ownerId : null,
      conversation.threadId,
      conversation.status,
      conversation.preview,
      conversation.summary,
      conversation.internalNotes ?? null,
      JSON.stringify({ seed: true, demoScenario: conversation.id }),
      conversation.aiState,
      conversation.pauseReason ?? null,
      conversation.createdOffset,
    ],
  );

  for (const [id, direction, senderType, body, offset] of conversation.messages) {
    await client.query(
      `
      INSERT INTO "Message" (
        "id", "conversationId", "direction", "senderType",
        "externalMessageId", "body", "rawBody", "displayBody",
        "normalizedBody", "searchBody", "detectedLanguage",
        "languageConfidence", "metadata", "sentAt", "createdAt"
      )
      VALUES (
        $1, $2, $3::"MessageDirection", $4::"SenderType",
        $5, $6, $6, $6,
        $7, $7, $8::"MessageLanguage",
        90, $9::jsonb,
        CASE WHEN $3 = 'OUTBOUND' THEN NOW() - ($10::INTERVAL) ELSE NULL END,
        NOW() - ($10::INTERVAL)
      )
      ON CONFLICT ("id") DO UPDATE SET
        "body" = EXCLUDED."body",
        "rawBody" = EXCLUDED."rawBody",
        "displayBody" = EXCLUDED."displayBody",
        "normalizedBody" = EXCLUDED."normalizedBody",
        "searchBody" = EXCLUDED."searchBody",
        "detectedLanguage" = EXCLUDED."detectedLanguage",
        "metadata" = EXCLUDED."metadata",
        "sentAt" = EXCLUDED."sentAt"
      `,
      [
        id,
        conversation.id,
        direction,
        senderType,
        `${id}_external`,
        body,
        normalizeText(body),
        conversation.language,
        JSON.stringify({ seed: true }),
        offset,
      ],
    );
  }
}

async function seedHandoff(client) {
  await client.query(
    `
    INSERT INTO "Handoff" (
      "id", "leadId", "conversationId", "assignedUserId",
      "reason", "status", "updatedAt"
    )
    VALUES (
      'seed_handoff_nikos', 'seed_lead_nikos', 'seed_conv_nikos',
      $1, 'Pricing and policy ambiguity requires human review.',
      'REQUESTED', NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "assignedUserId" = EXCLUDED."assignedUserId",
      "reason" = EXCLUDED."reason",
      "status" = 'REQUESTED',
      "updatedAt" = NOW()
    `,
    [seed.ownerId],
  );

  const events = [
    ["seed_handoff_event_nikos_requested", "REQUESTED", "Customer asked for pricing details.", null],
    ["seed_handoff_event_nikos_paused", "AI_PAUSED", "AI paused for human review.", null],
    ["seed_handoff_event_nikos_note", "NOTE_ADDED", null, "Ask about urgency and expected message volume before quoting."],
  ];

  for (const [id, eventType, reason, note] of events) {
    await client.query(
      `
      INSERT INTO "HandoffEvent" (
        "id", "organizationId", "conversationId", "leadId", "handoffId",
        "actorUserId", "eventType", "reason", "note", "metadata", "createdAt"
      )
      VALUES (
        $1, $2, 'seed_conv_nikos', 'seed_lead_nikos', 'seed_handoff_nikos',
        $3, $4::"HandoffEventType", $5, $6, $7::jsonb, NOW() - INTERVAL '18 hours'
      )
      ON CONFLICT ("id") DO UPDATE SET
        "eventType" = EXCLUDED."eventType",
        "reason" = EXCLUDED."reason",
        "note" = EXCLUDED."note",
        "metadata" = EXCLUDED."metadata"
      `,
      [
        id,
        seed.organizationId,
        seed.ownerId,
        eventType,
        reason,
        note,
        JSON.stringify({ seed: true }),
      ],
    );
  }
}

async function seedDemoBooking(client) {
  await client.query(
    `
    INSERT INTO "BookingRequest" (
      "id", "organizationId", "leadId", "conversationId", "meetingTypeId",
      "startsAt", "endsAt", "timezone", "status", "provider",
      "externalEventId", "customerName", "customerEmail", "customerPhone",
      "customerLocale", "summary", "notes", "structuredData",
      "confirmedAt", "updatedAt"
    )
    VALUES (
      'seed_booking_maria', $1, 'seed_lead_maria', 'seed_conv_maria',
      $2, NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes',
      'Europe/Athens', 'CONFIRMED', 'LOCAL_MOCK', 'local-seed-booking-maria',
      'Maria Papadopoulou', 'maria.papadopoulou@example.gr',
      '+306901234567', 'EN',
      'Intro call confirmed for Maria about AI sales assistant setup.',
      'Seeded confirmed appointment for demo analytics.',
      $3::jsonb, NOW() - INTERVAL '1 day', NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "status" = 'CONFIRMED',
      "startsAt" = EXCLUDED."startsAt",
      "endsAt" = EXCLUDED."endsAt",
      "summary" = EXCLUDED."summary",
      "structuredData" = EXCLUDED."structuredData",
      "confirmedAt" = EXCLUDED."confirmedAt",
      "updatedAt" = NOW()
    `,
    [
      seed.organizationId,
      seed.meetingTypeId,
      JSON.stringify({ source: "seed", meetingType: "Intro call" }),
    ],
  );

  await client.query(
    `
    INSERT INTO "BookingEvent" (
      "id", "organizationId", "bookingRequestId", "eventType",
      "message", "metadata", "createdAt"
    )
    VALUES (
      'seed_booking_event_maria_confirmed', $1, 'seed_booking_maria',
      'BOOKING_CONFIRMED',
      'Seed booking confirmed through local/mock provider.',
      $2::jsonb, NOW() - INTERVAL '1 day'
    )
    ON CONFLICT ("id") DO UPDATE SET
      "message" = EXCLUDED."message",
      "metadata" = EXCLUDED."metadata"
    `,
    [seed.organizationId, JSON.stringify({ seed: true })],
  );
}

async function seedDemoExports(client) {
  await client.query(
    `
    INSERT INTO "OutboundDestination" (
      "id", "organizationId", "name", "type", "provider", "status",
      "endpointUrl", "headers", "eventTypes", "includeRawConversation",
      "maxAttempts", "updatedAt"
    )
    VALUES (
      'seed_destination_webhook', $1, 'Preview CRM webhook',
      'WEBHOOK', 'WEBHOOK', 'ACTIVE',
      'https://example.com/northline-preview-webhook',
      $2::jsonb,
      ARRAY['LEAD_QUALIFIED', 'BOOKING_CONFIRMED']::"ExportEventType"[],
      false, 3, NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "status" = 'ACTIVE',
      "endpointUrl" = EXCLUDED."endpointUrl",
      "headers" = EXCLUDED."headers",
      "eventTypes" = EXCLUDED."eventTypes",
      "updatedAt" = NOW()
    `,
    [seed.organizationId, JSON.stringify({ "X-CRM-Source": "northline-preview" })],
  );

  const exports = [
    {
      id: "seed_export_maria",
      leadId: "seed_lead_maria",
      conversationId: "seed_conv_maria",
      bookingId: "seed_booking_maria",
      eventType: "BOOKING_CONFIRMED",
      status: "DELIVERED",
      error: null,
      responseStatus: 202,
      attemptStatus: "DELIVERED",
    },
    {
      id: "seed_export_eleni",
      leadId: "seed_lead_eleni",
      conversationId: "seed_conv_eleni",
      bookingId: null,
      eventType: "LEAD_QUALIFIED",
      status: "FAILED",
      error: "Preview CRM returned HTTP 503.",
      responseStatus: 503,
      attemptStatus: "RETRYING",
    },
  ];

  for (const item of exports) {
    const payload = {
      version: "northline.lead_export.v1",
      seed: true,
      eventType: item.eventType,
      leadId: item.leadId,
      conversationId: item.conversationId,
      bookingRequestId: item.bookingId,
      workspace: seed.organizationSlug,
    };
    await client.query(
      `
      INSERT INTO "LeadExport" (
        "id", "organizationId", "leadId", "conversationId",
        "bookingRequestId", "eventType", "payload", "payloadHash",
        "idempotencyKey", "status", "lastError", "deliveredAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6::"ExportEventType", $7::jsonb, $8,
        $9, $10::"ExportStatus", $11,
        CASE WHEN $10 = 'DELIVERED' THEN NOW() - INTERVAL '1 day' ELSE NULL END,
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "payload" = EXCLUDED."payload",
        "payloadHash" = EXCLUDED."payloadHash",
        "status" = EXCLUDED."status",
        "lastError" = EXCLUDED."lastError",
        "deliveredAt" = EXCLUDED."deliveredAt",
        "updatedAt" = NOW()
      `,
      [
        item.id,
        seed.organizationId,
        item.leadId,
        item.conversationId,
        item.bookingId,
        item.eventType,
        JSON.stringify(payload),
        `seed-hash-${item.id}`,
        `seed-idempotency-${item.id}`,
        item.status,
        item.error,
      ],
    );

    await client.query(
      `
      INSERT INTO "ExportDeliveryAttempt" (
        "id", "organizationId", "exportId", "destinationId",
        "status", "attemptNumber", "idempotencyKey",
        "requestPayloadHash", "responseStatus", "responseBody",
        "errorMessage", "nextAttemptAt", "deliveredAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, 'seed_destination_webhook',
        $4::"ExportDeliveryStatus", 1, $5,
        $6, $7, $8, $9,
        CASE WHEN $4 = 'RETRYING' THEN NOW() + INTERVAL '5 minutes' ELSE NULL END,
        CASE WHEN $4 = 'DELIVERED' THEN NOW() - INTERVAL '1 day' ELSE NULL END,
        NOW()
      )
      ON CONFLICT ("id") DO UPDATE SET
        "status" = EXCLUDED."status",
        "responseStatus" = EXCLUDED."responseStatus",
        "responseBody" = EXCLUDED."responseBody",
        "errorMessage" = EXCLUDED."errorMessage",
        "nextAttemptAt" = EXCLUDED."nextAttemptAt",
        "deliveredAt" = EXCLUDED."deliveredAt",
        "updatedAt" = NOW()
      `,
      [
        `seed_attempt_${item.id}`,
        seed.organizationId,
        item.id,
        item.attemptStatus,
        `seed-delivery-${item.id}`,
        `seed-hash-${item.id}`,
        item.responseStatus,
        item.status === "DELIVERED" ? "accepted" : "service unavailable",
        item.error,
      ],
    );
  }
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
