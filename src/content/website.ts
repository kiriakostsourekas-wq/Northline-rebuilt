export const siteConfig = {
  name: "Northline",
  domain: "northline.ai",
  email: "hello@northline.ai",
  description:
    "AI sales assistant for inbound leads across website chat and messaging channels.",
  nav: [
    { label: "Product", href: "/#product" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Channels", href: "/#channels" },
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
} as const;

export const homePage = {
  hero: {
    eyebrow: "AI sales assistant for inbound leads",
    title: "Reply faster, qualify better, and stop losing good leads.",
    body:
      "Northline helps businesses handle inbound inquiries from chat and messaging channels. It answers common questions, captures lead details, books meetings, and prepares clean handoffs for your team.",
    bullets: [
      "Greek and English support from the start",
      "Built for Greek and European SMB operations",
      "Preview-only rebuild, separate from the live northline.ai site",
    ],
  },
  trust: {
    eyebrow: "Built for practical sales teams",
    title: "Designed around the moments where leads usually drop.",
    metrics: [
      { value: "< 1 min", label: "target first-response workflow" },
      { value: "2", label: "launch languages: Greek and English" },
      { value: "7", label: "planned channel categories" },
    ],
    proof: [
      "No production cutover during rebuild",
      "PostgreSQL-ready product foundation",
      "Consent and handoff concepts built in",
    ],
  },
  problemSolution: {
    eyebrow: "Problem and solution",
    title: "Most lead loss is operational, not mysterious.",
    problem:
      "A visitor asks a question after hours. A WhatsApp message waits too long. A sales rep asks the same qualifying questions again. A booking link is sent without context. Each small delay makes the lead colder.",
    solution:
      "Northline gives inbound leads a structured path: immediate reply, grounded qualification, booking recommendation, and a clean handoff into the systems your business already uses.",
    points: [
      "Respond to common inquiries before the team is available",
      "Collect fit, urgency, location, budget, and contact details consistently",
      "Escalate sensitive or low-confidence conversations to a human",
      "Prepare CRM, webhook, and booking data without manual cleanup",
    ],
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "A simple workflow from first message to next step.",
    steps: [
      {
        title: "Capture",
        body:
          "Website chat and messaging channels feed one lead workflow instead of scattered inboxes.",
      },
      {
        title: "Reply",
        body:
          "Northline answers routine questions using the business knowledge you provide.",
      },
      {
        title: "Qualify",
        body:
          "The assistant asks only the questions needed to understand fit, urgency, and contactability.",
      },
      {
        title: "Convert",
        body:
          "Qualified leads are routed to booking, CRM, webhook, or a human owner with context attached.",
      },
    ],
  },
  channels: {
    eyebrow: "Supported channels",
    title: "One sales workflow across the places leads already message you.",
    body:
      "The first build focuses on website chat and clean channel abstractions. The architecture is prepared for messaging platforms and API-based intake as credentials become available.",
    items: [
      "Website chat",
      "WhatsApp",
      "Instagram",
      "Facebook Messenger",
      "Viber",
      "Email",
      "API intake",
      "CRM/webhook events",
    ],
  },
  features: {
    eyebrow: "Core features",
    title: "Everything needed before a salesperson takes over.",
    items: [
      {
        title: "Lead capture",
        body:
          "Turn each inbound conversation into a structured lead record with source, language, consent, and owner context.",
      },
      {
        title: "Grounded replies",
        body:
          "Use business knowledge such as services, areas, pricing rules, policies, and FAQs to answer without guessing.",
      },
      {
        title: "Qualification playbooks",
        body:
          "Ask consistent questions and score readiness without pretending AI can close every deal alone.",
      },
      {
        title: "Booking assistance",
        body:
          "Recommend meeting or appointment paths when the lead is ready and the next step is clear.",
      },
      {
        title: "System sync",
        body:
          "Prepare clean lead data for CRM, webhook, calendar, or internal workflows as integrations are added.",
      },
      {
        title: "Human handoff",
        body:
          "Route high-value, sensitive, or uncertain conversations to the right teammate with the thread summary attached.",
      },
    ],
  },
  useCases: {
    eyebrow: "Industry flexibility",
    title: "Broad enough for many businesses, specific enough to be useful.",
    body:
      "Northline is not locked to one vertical. Industry templates can come later; the base workflow works for teams that need fast response, qualification, booking, and handoff.",
    items: [
      "Clinics and wellness practices",
      "Home and field services",
      "Education and training providers",
      "Professional services",
      "Real estate and property teams",
      "Hospitality and local commerce",
    ],
  },
  preview: {
    eyebrow: "Product preview",
    title: "A lead desk your team can actually operate.",
    body:
      "The product UI is designed around status, urgency, missing information, language, source channel, and the next best action. The goal is clarity for operators, not a black-box chatbot.",
  },
  pricingTeaser: {
    eyebrow: "Pricing",
    title: "Start with preview access while the product is rebuilt.",
    body:
      "Public pricing will be finalized after the first product workflows are validated. Early conversations help shape packaging for Greek and European businesses.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Straight answers before you request a demo.",
    items: [
      {
        question: "Is Northline only for one industry?",
        answer:
          "No. The core workflow is broad: capture, reply, qualify, book, sync, and hand off. Later templates can add industry-specific questions and knowledge.",
      },
      {
        question: "Does it support Greek?",
        answer:
          "Yes. Greek and English are treated as first-class languages for the product direction, content, and future conversation workflows.",
      },
      {
        question: "Will it replace my sales team?",
        answer:
          "No. Northline handles repetitive inbound work and prepares better handoffs. Human review remains important for sensitive, high-value, or unclear conversations.",
      },
      {
        question: "Which integrations are included now?",
        answer:
          "This rebuild includes the internal structure for channels, booking, CRM/webhook sync, and handoff. External credentials are intentionally not required for the marketing preview.",
      },
    ],
  },
  finalCta: {
    eyebrow: "Preview access",
    title: "See how Northline would handle your inbound leads.",
    body:
      "Share your business type, lead sources, and current response workflow. We will use that context to shape the right demo path.",
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
