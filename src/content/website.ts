export const siteConfig = {
  name: "Northline",
  domain: "northline.ai",
  email: "hello@northline.ai",
  description:
    "Inbound lead handling for website chat and messaging channels.",
  nav: [
    { label: "Product", href: "/#product" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Industries", href: "/industries" },
    { label: "Pricing", href: "/pricing" },
  ],
  footer: {
    note:
      "Northline is being built in a new preview-only project. The live northline.ai production site remains untouched during this rebuild.",
    groups: [
      {
        title: "Product",
        links: [
          { label: "Overview", href: "/" },
          { label: "Solutions", href: "/solutions" },
          { label: "How it works", href: "/how-it-works" },
          { label: "Industries", href: "/industries" },
          { label: "Destinations", href: "/destinations" },
          { label: "Pricing", href: "/pricing" },
          { label: "Contact", href: "/contact" },
          { label: "Style guide", href: "/style-guide" },
        ],
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Privacy", href: "/privacy" },
          { label: "Terms", href: "/terms" },
        ],
      },
    ],
  },
} as const;

export const cta = {
  requestDemo: "Book demo",
  joinWaitlist: "Join waitlist",
  submitInterest: "Submit interest",
  seePricing: "See pricing",
  seeProduct: "See product",
  seeWorkflow: "See workflow",
} as const;

export const homePage = {
  hero: {
    eyebrow: "AI lead handling for Greek SMBs",
    title: "Turn missed chats into qualified leads before they go cold.",
    body:
      "Replies in Greek and English. Qualifies each lead. Routes to booking, CRM, or handoff.",
  },
  demo: {
    eyebrow: "Preview workflow",
    title: "Watch the journey from first message to next step.",
    body:
      "This synthetic preview shows the intended product workflow: capture the message, qualify the lead, and send a clean handoff packet to the team.",
    posterAlt:
      "Northline preview dashboard showing a live website chat lead, qualification fields, and a handoff packet.",
  },
  proof: {
    items: [
      {
        title: "Preview rebuild",
        body: "A dedicated rebuild project, separate from the live northline.ai site.",
      },
      {
        title: "Greek and English",
        body: "Reply, qualify, and hand off in both launch languages.",
      },
      {
        title: "Human handoff included",
        body: "Escalate with source, summary, missing details, and next action.",
      },
      {
        title: "Server-side workflow",
        body: "Postgres-backed records, signed webhooks, and destination-ready payloads.",
      },
    ],
  },
  problem: {
    eyebrow: "Painpoint",
    title: "The lead is warm for minutes. Most teams respond in hours.",
    body:
      "For clinics, local services, agencies, and hospitality teams, the first reply decides whether a buyer keeps moving or tries the next provider.",
    items: [
      {
        title: "After-hours messages",
        body: "High-intent visitors ask pricing or availability while the team is offline.",
      },
      {
        title: "Slow response",
        body: "A lead that wanted a call today waits for a manual follow-up tomorrow.",
      },
      {
        title: "Scattered inboxes",
        body: "Website chat, WhatsApp, Instagram, and notes split the same sales context.",
      },
      {
        title: "No clean next step",
        body: "The team sees a message thread instead of fit, urgency, owner, and action.",
      },
    ],
  },
  calculator: {
    eyebrow: "Lost lead estimator",
    title: "A conservative way to see the leak.",
    body:
      "This is not a promise or forecast. It simply shows how quickly missed conversations can matter when even a few buyers are ready to talk.",
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "A simple path from message to qualified next step.",
    steps: [
      {
        title: "Capture",
        body:
          "Bring every inbound message into one lead workflow with source, language, and consent context.",
      },
      {
        title: "Qualify",
        body:
          "Reply in Greek or English and ask only the follow-up questions needed for fit, urgency, contact, and consent.",
      },
      {
        title: "Book or hand off",
        body:
          "Suggest a booking path or route the conversation to a human with a short, structured summary.",
      },
      {
        title: "Sync",
        body:
          "Prepare the lead record for webhook, CRM, calendar, or internal follow-up without copying message threads.",
      },
    ],
  },
  channels: {
    eyebrow: "Channels",
    title: "One lead workflow across the channels buyers already use.",
    body:
      "Northline keeps the qualification path consistent as leads arrive from chat and messaging channels.",
    items: [
      {
        title: "Website chat",
        body: "Capture visitors while intent is active.",
      },
      {
        title: "WhatsApp",
        body: "Continue sales conversations in a familiar channel.",
      },
      {
        title: "Instagram",
        body: "Turn social messages into structured lead records.",
      },
      {
        title: "Messenger",
        body: "Keep Facebook inquiries in the same workflow.",
      },
    ],
  },
  features: {
    eyebrow: "Structured lead data",
    title: "The output is not just a chat transcript.",
    body:
      "Northline keeps the fields your team needs for follow-up, booking, and system sync.",
    items: [
      {
        title: "Contact and consent",
        body:
          "Capture name, email, company, contact permission, and source before handoff.",
      },
      {
        title: "Need and urgency",
        body:
          "Track what the lead wants, how soon they need it, and whether they are ready to book.",
      },
      {
        title: "Language and channel",
        body:
          "Keep Greek or English preference and the original source channel visible.",
      },
      {
        title: "Booking path",
        body:
          "Show when a meeting, appointment, or consultation is the right next step.",
      },
      {
        title: "Handoff summary",
        body:
          "Give the team a short context summary instead of a raw message thread.",
      },
      {
        title: "Sync-ready payloads",
        body:
          "Prepare structured fields for CRM, webhook, calendar, or internal tools.",
      },
    ],
  },
  finalCta: {
    eyebrow: "Preview walkthrough",
    title: "Bring one real lead workflow. We will map it end to end.",
    body:
      "Share where leads arrive, what your team needs to know, and what should happen after qualification. We will shape the walkthrough around your actual handoff path.",
  },
  industries: {
    eyebrow: "Where it starts",
    title: "Built first for Greek SMB teams that win or lose on response time.",
    body:
      "Northline is most useful when a buyer asks for availability, pricing, appointment times, or a fast human follow-up.",
    items: [
      {
        title: "Clinics",
        body: "Capture appointment intent, preferred language, urgency, and contact permission.",
      },
      {
        title: "Agencies",
        body: "Qualify budget, timeline, service fit, and route sales-ready leads.",
      },
      {
        title: "Local services",
        body: "Handle after-hours service requests and collect the details needed for follow-up.",
      },
      {
        title: "Tourism and hospitality",
        body: "Answer common questions, collect dates and preferences, and hand off cleanly.",
      },
    ],
  },
} as const;

export const pricingPage = {
  hero: {
    eyebrow: "Pricing",
    title: "Preview pricing for teams that want faster inbound lead handling.",
    body:
      "Northline is in rebuild mode. Packages below show the intended structure for early-access conversations, not a production billing launch.",
  },
  plans: [
    {
      name: "Starter",
      price: "Preview",
      description:
        "For businesses validating website lead capture and qualification.",
      features: [
        "Website chat intake",
        "Greek and English lead flows",
        "Basic qualification scoring",
        "Email-based demo and waitlist capture",
      ],
    },
    {
      name: "Operator",
      price: "Planned",
      description:
        "For teams that need routing, booking, and multiple lead sources.",
      features: [
        "Unified inbox workflow",
        "Qualification playbooks",
        "Booking recommendations",
        "Human handoff states",
        "CRM/webhook sync structure",
      ],
      featured: true,
    },
    {
      name: "Scale",
      price: "Later",
      description:
        "For multi-location or integration-heavy sales operations.",
      features: [
        "Advanced admin controls",
        "Analytics and reporting",
        "Multi-team routing",
        "Security and privacy hardening",
        "Custom integration planning",
      ],
    },
  ],
  faq: [
    {
      question: "Can I buy Northline today?",
      answer:
        "Not as a production subscription yet. This rebuild is preview-only while the product workflows are validated.",
    },
    {
      question: "Will pricing change?",
      answer:
        "Yes. Final packaging will depend on channel access, usage, integrations, support level, and security requirements.",
    },
    {
      question: "Can we discuss a pilot?",
      answer:
        "Yes. The contact form is set up for demo requests and early-access interest.",
    },
  ],
} as const;

export const aboutPage = {
  hero: {
    eyebrow: "About Northline",
    title: "A practical AI layer for inbound sales operations.",
    body:
      "Northline is being rebuilt to help businesses in Greece and Europe respond to inbound demand with more consistency, less manual work, and cleaner handoffs.",
  },
  principles: [
    {
      title: "Operational before flashy",
      body:
        "The product should make lead handling clearer for owners and operators, not add another dashboard that nobody trusts.",
    },
    {
      title: "Human handoff is a feature",
      body:
        "AI should know when to stop. Northline is designed to escalate when confidence, context, or sensitivity requires a person.",
    },
    {
      title: "Language matters",
      body:
        "Greek and English support is part of the core product direction, not a later marketing add-on.",
    },
  ],
  roadmap: [
    "Marketing website",
    "App shell and authentication",
    "Unified inbox and channel abstraction",
    "Business knowledge base",
    "Conversation engine and playbooks",
    "Booking, CRM/webhook sync, handoff, and analytics",
  ],
} as const;

export const contactPage = {
  hero: {
    eyebrow: "Contact",
    title: "Tell us where inbound leads slow down.",
    body:
      "Request a demo, join the early-access list, or share the workflow you want Northline to support.",
  },
  cards: [
    {
      title: "Request a demo",
      body:
        "Best if you already know your main lead sources and want to see the workflow.",
    },
    {
      title: "Join the waitlist",
      body:
        "Best if you want updates as the preview product moves toward app access.",
    },
    {
      title: "Share a use case",
      body:
        "Best if your business has specific booking, routing, or integration needs.",
    },
  ],
} as const;

export const legalPages = {
  privacy: {
    eyebrow: "Privacy",
    title: "Privacy notice for the Northline rebuild preview.",
    updated: "April 26, 2026",
    intro:
      "This notice explains how the preview marketing site is intended to handle information submitted through demo, waitlist, and contact forms. It is not a production service privacy policy.",
    sections: [
      {
        title: "Information we collect",
        body:
          "Forms may ask for your name, email, company, website, country, team size, and a short message about your inbound lead workflow.",
      },
      {
        title: "How information is used",
        body:
          "Submitted information is used to respond to demo requests, understand early-access interest, and shape product requirements for the rebuild.",
      },
      {
        title: "Production separation",
        body:
          "This repository and preview project are separate from the existing live northline.ai production project. No production-domain cutover is part of this work.",
      },
      {
        title: "Future updates",
        body:
          "Before any production launch, this notice should be replaced with a complete privacy policy covering processors, retention, security, and user rights.",
      },
    ],
  },
  terms: {
    eyebrow: "Terms",
    title: "Preview website terms.",
    updated: "April 26, 2026",
    intro:
      "These terms cover use of the Northline rebuild preview website. They do not describe a production subscription agreement.",
    sections: [
      {
        title: "Preview status",
        body:
          "The website and product descriptions are provided for preview and planning. Features, packaging, and availability may change.",
      },
      {
        title: "No production cutover",
        body:
          "Nothing on this preview site authorizes or performs changes to the existing live northline.ai production project or domain.",
      },
      {
        title: "No professional advice",
        body:
          "Content on the preview site is informational and should not be treated as legal, financial, or security advice.",
      },
      {
        title: "Future agreement",
        body:
          "A complete customer agreement should be created before any paid production service is offered.",
      },
    ],
  },
} as const;
