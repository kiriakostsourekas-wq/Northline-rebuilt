export const siteConfig = {
  name: "Northline",
  domain: "northline.ai",
  email: "hello@northline.ai",
  description:
    "Inbound lead handling for website chat and messaging channels.",
  nav: [
    { label: "Solutions", href: "/solutions" },
    { label: "How it works", href: "/how-it-works" },
    { label: "Industries", href: "/industries" },
    { label: "Destinations", href: "/destinations" },
    { label: "Pricing", href: "/pricing" },
    { label: "About", href: "/about" },
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
  requestDemo: "Request demo",
  joinWaitlist: "Join waitlist",
  submitInterest: "Submit interest",
  seePricing: "See pricing",
  seeProduct: "See product",
  seeWorkflow: "See workflow",
} as const;

export const homePage = {
  hero: {
    eyebrow: "Inbound lead handling for chat and messaging",
    title: "Never lose an inbound lead again.",
    body:
      "Northline captures, qualifies, and routes inbound leads from website chat and messaging channels. It replies quickly, asks the right follow-up questions, and hands off with context.",
  },
  proof: {
    items: [
      {
        title: "Greek and English",
        body: "Reply and qualify in both launch languages.",
      },
      {
        title: "Website chat + messaging",
        body: "One workflow for WhatsApp, Instagram, and Messenger.",
      },
      {
        title: "Human handoff included",
        body: "Escalate with source, summary, and missing details.",
      },
      {
        title: "Booking and routing",
        body: "Send qualified leads to calendar, CRM, or webhook paths.",
      },
    ],
  },
  problem: {
    eyebrow: "Problem",
    title: "Most leads are lost between first message and follow-up.",
    body:
      "Inbound demand rarely fails at the form submit. It leaks after the message arrives, when response time, qualification, and ownership are unclear.",
    items: [
      {
        title: "No response after hours",
        body: "High-intent leads wait until the team is back online.",
      },
      {
        title: "Slow qualification",
        body: "The same basic questions get asked manually every time.",
      },
      {
        title: "Repeated follow-up",
        body: "Context gets copied between inboxes, notes, and calendars.",
      },
      {
        title: "No clear next step",
        body: "Ready leads are not always booked, routed, or owned.",
      },
    ],
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "A simple path from first message to next action.",
    steps: [
      {
        title: "Capture",
        body:
          "Bring every inbound message into one lead workflow with source, language, and consent context.",
      },
      {
        title: "Reply",
        body:
          "Answer quickly in Greek or English using the business details you approve.",
      },
      {
        title: "Qualify",
        body:
          "Ask only the follow-up questions needed for fit, urgency, contact, and booking readiness.",
      },
      {
        title: "Book or hand off",
        body:
          "Suggest a booking path or route the conversation to a human with a short summary.",
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
    title: "See how Northline fits your lead workflow.",
    body:
      "Share the channels where leads arrive and what should happen after qualification. We will shape the demo around your actual handoff path.",
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
