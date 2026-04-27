export const locales = ["en", "el"] as const;

export type Locale = (typeof locales)[number];

export type MarketingCopy = {
  languageLabel: string;
  alternateLabel: string;
  alternateHref: string;
  nav: {
    platform: string;
    workflow: string;
    pricing: string;
    security: string;
    faq: string;
  };
  cta: {
    primary: string;
    secondary: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    proof: string[];
  };
  preview: {
    title: string;
    subtitle: string;
    signalTitle: string;
    nextActionLabel: string;
    nextAction: string;
    threads: {
      name: string;
      channel: string;
      summary: string;
      status: string;
      score: string;
    }[];
    signals: string[];
  };
  metrics: {
    value: string;
    label: string;
  }[];
  problem: {
    eyebrow: string;
    title: string;
    body: string;
    bullets: string[];
  };
  platform: {
    eyebrow: string;
    title: string;
    body: string;
    capabilities: {
      title: string;
      body: string;
    }[];
  };
  workflow: {
    eyebrow: string;
    title: string;
    steps: {
      title: string;
      body: string;
    }[];
  };
  industries: {
    eyebrow: string;
    title: string;
    body: string;
    items: string[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    items: {
      quote: string;
      name: string;
      role: string;
      company: string;
    }[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    body: string;
    plans: {
      name: string;
      price: string;
      description: string;
      features: string[];
      featured?: boolean;
    }[];
  };
  security: {
    eyebrow: string;
    title: string;
    body: string;
    items: string[];
  };
  faq: {
    eyebrow: string;
    title: string;
    items: {
      question: string;
      answer: string;
    }[];
  };
  finalCta: {
    eyebrow: string;
    title: string;
    body: string;
  };
  footer: {
    note: string;
    styleGuide: string;
  };
};

export const marketingCopy: Record<Locale, MarketingCopy> = {
  en: {
    languageLabel: "English",
    alternateLabel: "EL",
    alternateHref: "/el",
    nav: {
      platform: "Platform",
      workflow: "Workflow",
      pricing: "Pricing",
      security: "Security",
      faq: "FAQ",
    },
    cta: {
      primary: "Request preview",
      secondary: "See workflow",
    },
    hero: {
      eyebrow: "Greece first. Europe ready.",
      title: "Northline",
      subtitle:
        "AI sales assistant for inbound leads across website chat and messaging channels. Capture every inquiry, qualify it consistently, and route the next best action before the lead goes cold.",
      proof: [
        "Greek and English from day one",
        "Built for SMB sales operations",
        "Preview deployments only during rebuild",
      ],
    },
    preview: {
      title: "Lead desk",
      subtitle:
        "Website chat and messaging leads with status, missing details, and next action.",
      signalTitle: "Lead signals",
      nextActionLabel: "Suggested next step",
      nextAction: "Offer booking times",
      threads: [
        {
          name: "Maria K.",
          channel: "Website chat",
          summary: "Asked for pricing and wants a consultation this week.",
          status: "Ready to book",
          score: "92",
        },
        {
          name: "Andreas P.",
          channel: "Instagram",
          summary: "Needs service area confirmation before a quote.",
          status: "Ask follow-up",
          score: "71",
        },
        {
          name: "Elena D.",
          channel: "WhatsApp",
          summary: "Shared requirements, missing contact permission.",
          status: "Human review",
          score: "48",
        },
      ],
      signals: [
        "Intent",
        "Language",
        "Consent",
        "Booking readiness",
      ],
    },
    metrics: [
      { value: "2", label: "launch languages" },
      { value: "8", label: "planned channel types" },
      { value: "100%", label: "new rebuild repository" },
    ],
    problem: {
      eyebrow: "Why Northline",
      title: "Inbound leads leak when every channel works differently.",
      body:
        "Small teams often answer chats from several apps, ask different qualification questions, and lose context before a salesperson can act. Northline turns those inbound moments into a repeatable sales workflow.",
      bullets: [
        "One lead record across chat and messaging channels",
        "Consistent qualification without pretending AI closes the deal alone",
        "Clear routing to booking, CRM, webhook, or a human teammate",
      ],
    },
    platform: {
      eyebrow: "Platform",
      title: "A simple operating layer for inbound sales.",
      body:
        "The rebuild starts with the marketing website and is structured for the product modules that follow: inbox, channels, knowledge base, conversation engine, playbooks, booking, integrations, handoff, and analytics.",
      capabilities: [
        {
          title: "Unified inbox",
          body:
            "Normalize website chat and messaging threads into a shared lead queue with source, consent, language, and ownership context.",
        },
        {
          title: "Business knowledge",
          body:
            "Store services, service areas, policies, FAQs, and qualification rules so replies stay grounded in what the business actually offers.",
        },
        {
          title: "Qualification playbooks",
          body:
            "Score readiness, identify missing fields, and recommend the next action using transparent rules that can evolve by industry.",
        },
        {
          title: "Booking and routing",
          body:
            "Move qualified leads to a calendar, salesperson, CRM, webhook, or human handoff path with the original context intact.",
        },
        {
          title: "Language coverage",
          body:
            "Treat Greek and English as first-class operating languages for content, qualification prompts, and future conversation flows.",
        },
        {
          title: "Privacy controls",
          body:
            "Track consent, minimize stored data, and prepare the foundation for EU-focused security and administrative controls.",
        },
      ],
    },
    workflow: {
      eyebrow: "Workflow",
      title: "Capture, qualify, convert, and hand off.",
      steps: [
        {
          title: "Capture",
          body:
            "Bring inbound conversations from site chat and messaging channels into one operational queue.",
        },
        {
          title: "Qualify",
          body:
            "Ask only the questions needed to understand fit, urgency, language, location, and contactability.",
        },
        {
          title: "Convert",
          body:
            "Recommend booking, routing, or integration actions when a lead is ready for the next step.",
        },
        {
          title: "Hand off",
          body:
            "Escalate low-confidence, sensitive, or high-value conversations to a human with the context attached.",
        },
      ],
    },
    industries: {
      eyebrow: "Industry breadth",
      title: "Broad by design, template-ready later.",
      body:
        "Northline is not built for one vertical. The core model supports service businesses, clinics, professional services, education providers, real estate teams, hospitality, and other SMB sales workflows.",
      items: [
        "Home and field services",
        "Clinics and wellness",
        "Professional services",
        "Education and training",
        "Real estate and property",
        "Hospitality and local commerce",
      ],
    },
    testimonials: {
      eyebrow: "Proof direction",
      title: "Built for operators who need fewer dropped leads.",
      items: [
        {
          quote:
            "Northline is being designed around the reality of small sales teams: fast context, clear status, and no mystery handoffs.",
          name: "Eleni Markou",
          role: "Operations lead",
          company: "Service business pilot",
        },
        {
          quote:
            "The value is not another chatbot. It is the discipline around qualification, booking, and knowing when a human should step in.",
          name: "Nikos Vasileiou",
          role: "Founder",
          company: "B2B services advisor",
        },
      ],
    },
    pricing: {
      eyebrow: "Packaging preview",
      title: "A simple path from preview to production readiness.",
      body:
        "Pricing is not active during the rebuild. These cards define the visual system and the likely packaging shape for future preview conversations.",
      plans: [
        {
          name: "Starter",
          price: "Preview",
          description: "For a small team validating inbound capture and qualification.",
          features: [
            "Website chat intake",
            "Greek and English copy paths",
            "Lead scoring foundation",
            "Email-based preview requests",
          ],
        },
        {
          name: "Operator",
          price: "Planned",
          description: "For teams that need routing, booking, and channel coverage.",
          features: [
            "Unified inbox",
            "Qualification playbooks",
            "Booking recommendations",
            "Human handoff states",
          ],
          featured: true,
        },
        {
          name: "Scale",
          price: "Later",
          description: "For multi-location businesses and integration-heavy workflows.",
          features: [
            "CRM and webhook events",
            "Admin analytics",
            "Advanced permissions",
            "Security hardening",
          ],
        },
      ],
    },
    security: {
      eyebrow: "Security and deployment",
      title: "Designed for a careful rebuild.",
      body:
        "The live Northline production project on northline.ai remains untouched during this phase. This repository is the new rebuild and should use preview deployments until the product is ready for launch planning.",
      items: [
        "No production-domain cutover in this build phase",
        "Environment variables documented and ignored by default",
        "Prisma schema prepared for PostgreSQL",
        "Consent and audit concepts represented in the data model",
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Practical answers for the first build phase.",
      items: [
        {
          question: "Is Northline replacing salespeople?",
          answer:
            "No. Northline helps teams capture and qualify inbound demand, then routes the lead to booking, CRM, webhook, or a human when that is the right next step.",
        },
        {
          question: "Which channels are planned?",
          answer:
            "The architecture is prepared for website chat, WhatsApp, Instagram, Facebook Messenger, Viber, email, and API-based channels. Credentials are intentionally not required for this first local build.",
        },
        {
          question: "Can it support different industries?",
          answer:
            "Yes. The core qualification model is broad, and later industry templates can add specialized questions, knowledge sources, and routing policies.",
        },
      ],
    },
    finalCta: {
      eyebrow: "Preview only",
      title: "Start with the inbound lead workflow.",
      body:
        "The rebuild now has a clear marketing surface and a product foundation ready for the app shell, auth, inbox, and channel abstractions that come next.",
    },
    footer: {
      note:
        "Preview-only Northline rebuild. The existing live northline.ai production project remains untouched during this phase.",
      styleGuide: "Style guide",
    },
  },
  el: {
    languageLabel: "Ελληνικά",
    alternateLabel: "EN",
    alternateHref: "/en",
    nav: {
      platform: "Πλατφόρμα",
      workflow: "Ροή",
      pricing: "Πακέτα",
      security: "Ασφάλεια",
      faq: "FAQ",
    },
    cta: {
      primary: "Ζητήστε preview",
      secondary: "Δείτε τη ροή",
    },
    hero: {
      eyebrow: "Πρώτα Ελλάδα. Έτοιμο για Ευρώπη.",
      title: "Northline",
      subtitle:
        "AI βοηθός πωλήσεων για εισερχόμενα leads από website chat και messaging κανάλια. Καταγράψτε κάθε ενδιαφέρον, αξιολογήστε το με συνέπεια και δρομολογήστε την επόμενη ενέργεια πριν χαθεί το lead.",
      proof: [
        "Ελληνικά και Αγγλικά από την πρώτη ημέρα",
        "Σχεδιασμένο για SMB sales operations",
        "Μόνο preview deployments κατά το rebuild",
      ],
    },
    preview: {
      title: "Lead desk",
      subtitle:
        "Leads από website chat και messaging με status, ελλείψεις και επόμενη ενέργεια.",
      signalTitle: "Lead signals",
      nextActionLabel: "Επόμενη ενέργεια",
      nextAction: "Πρόταση για διαθέσιμα ραντεβού",
      threads: [
        {
          name: "Μαρία Κ.",
          channel: "Website chat",
          summary: "Ζήτησε τιμές και consultation μέσα στην εβδομάδα.",
          status: "Έτοιμο για booking",
          score: "92",
        },
        {
          name: "Ανδρέας Π.",
          channel: "Instagram",
          summary: "Χρειάζεται επιβεβαίωση περιοχής πριν την προσφορά.",
          status: "Follow-up",
          score: "71",
        },
        {
          name: "Έλενα Δ.",
          channel: "WhatsApp",
          summary: "Έδωσε ανάγκες, λείπει συγκατάθεση επικοινωνίας.",
          status: "Human review",
          score: "48",
        },
      ],
      signals: [
        "Intent",
        "Γλώσσα",
        "Consent",
        "Booking readiness",
      ],
    },
    metrics: [
      { value: "2", label: "γλώσσες στο launch" },
      { value: "8", label: "planned channel types" },
      { value: "100%", label: "νέο rebuild repository" },
    ],
    problem: {
      eyebrow: "Γιατί Northline",
      title: "Τα inbound leads χάνονται όταν κάθε κανάλι δουλεύει αλλιώς.",
      body:
        "Οι μικρές ομάδες απαντούν σε chats από πολλά apps, κάνουν διαφορετικές ερωτήσεις και χάνουν context πριν δράσει ο πωλητής. Το Northline μετατρέπει αυτές τις στιγμές σε επαναλαμβανόμενη sales ροή.",
      bullets: [
        "Ένα lead record για chat και messaging κανάλια",
        "Συνεπής αξιολόγηση χωρίς υπερβολικές υποσχέσεις για AI",
        "Καθαρή δρομολόγηση σε booking, CRM, webhook ή άνθρωπο",
      ],
    },
    platform: {
      eyebrow: "Πλατφόρμα",
      title: "Ένα απλό operating layer για inbound sales.",
      body:
        "Το rebuild ξεκινά με το marketing website και οργανώνεται για τα επόμενα modules: inbox, channels, knowledge base, conversation engine, playbooks, booking, integrations, handoff και analytics.",
      capabilities: [
        {
          title: "Unified inbox",
          body:
            "Κανονικοποιεί website chat και messaging threads σε κοινή ουρά με source, consent, γλώσσα και ownership context.",
        },
        {
          title: "Business knowledge",
          body:
            "Αποθηκεύει υπηρεσίες, περιοχές, πολιτικές, FAQs και κανόνες αξιολόγησης ώστε οι απαντήσεις να μένουν grounded.",
        },
        {
          title: "Qualification playbooks",
          body:
            "Βαθμολογεί readiness, εντοπίζει ελλείψεις και προτείνει επόμενη ενέργεια με διαφανείς κανόνες.",
        },
        {
          title: "Booking and routing",
          body:
            "Στέλνει qualified leads σε calendar, salesperson, CRM, webhook ή human handoff με όλο το context.",
        },
        {
          title: "Language coverage",
          body:
            "Αντιμετωπίζει Ελληνικά και Αγγλικά ως πρώτες γλώσσες για content, prompts και μελλοντικές conversation flows.",
        },
        {
          title: "Privacy controls",
          body:
            "Καταγράφει consent, περιορίζει stored data και προετοιμάζει EU-focused security και admin controls.",
        },
      ],
    },
    workflow: {
      eyebrow: "Ροή",
      title: "Capture, qualify, convert και handoff.",
      steps: [
        {
          title: "Capture",
          body:
            "Συγκεντρώνει inbound conversations από site chat και messaging κανάλια σε μία operational queue.",
        },
        {
          title: "Qualify",
          body:
            "Κάνει μόνο τις απαραίτητες ερωτήσεις για fit, urgency, γλώσσα, περιοχή και contactability.",
        },
        {
          title: "Convert",
          body:
            "Προτείνει booking, routing ή integration ενέργειες όταν το lead είναι έτοιμο.",
        },
        {
          title: "Hand off",
          body:
            "Κλιμακώνει low-confidence, sensitive ή high-value conversations σε άνθρωπο με attached context.",
        },
      ],
    },
    industries: {
      eyebrow: "Industry breadth",
      title: "Broad by design, template-ready later.",
      body:
        "Το Northline δεν είναι φτιαγμένο για ένα μόνο vertical. Ο πυρήνας υποστηρίζει service businesses, clinics, professional services, education providers, real estate teams, hospitality και άλλες SMB sales ροές.",
      items: [
        "Home and field services",
        "Clinics and wellness",
        "Professional services",
        "Education and training",
        "Real estate and property",
        "Hospitality and local commerce",
      ],
    },
    testimonials: {
      eyebrow: "Proof direction",
      title: "Σχεδιασμένο για operators που δεν θέλουν χαμένα leads.",
      items: [
        {
          quote:
            "Το Northline σχεδιάζεται γύρω από την πραγματικότητα μικρών sales teams: γρήγορο context, καθαρό status και όχι ασαφή handoffs.",
          name: "Ελένη Μάρκου",
          role: "Operations lead",
          company: "Service business pilot",
        },
        {
          quote:
            "Η αξία δεν είναι άλλο ένα chatbot. Είναι η πειθαρχία στο qualification, στο booking και στο πότε πρέπει να μπει άνθρωπος.",
          name: "Νίκος Βασιλείου",
          role: "Founder",
          company: "B2B services advisor",
        },
      ],
    },
    pricing: {
      eyebrow: "Packaging preview",
      title: "Απλή διαδρομή από preview σε production readiness.",
      body:
        "Το pricing δεν είναι ενεργό κατά το rebuild. Οι κάρτες ορίζουν το visual system και την πιθανή δομή πακέτων για μελλοντικές preview συζητήσεις.",
      plans: [
        {
          name: "Starter",
          price: "Preview",
          description: "Για μικρή ομάδα που δοκιμάζει inbound capture και qualification.",
          features: [
            "Website chat intake",
            "Greek and English copy paths",
            "Lead scoring foundation",
            "Email-based preview requests",
          ],
        },
        {
          name: "Operator",
          price: "Planned",
          description: "Για ομάδες που χρειάζονται routing, booking και channel coverage.",
          features: [
            "Unified inbox",
            "Qualification playbooks",
            "Booking recommendations",
            "Human handoff states",
          ],
          featured: true,
        },
        {
          name: "Scale",
          price: "Later",
          description: "Για multi-location businesses και integration-heavy workflows.",
          features: [
            "CRM and webhook events",
            "Admin analytics",
            "Advanced permissions",
            "Security hardening",
          ],
        },
      ],
    },
    security: {
      eyebrow: "Security and deployment",
      title: "Σχεδιασμένο για προσεκτικό rebuild.",
      body:
        "Το υπάρχον live Northline production project στο northline.ai μένει ανέγγιχτο σε αυτή τη φάση. Αυτό το repository είναι το νέο rebuild και πρέπει να χρησιμοποιεί preview deployments μέχρι να υπάρξει launch plan.",
      items: [
        "Καμία παραγωγική αλλαγή domain σε αυτή τη φάση",
        "Environment variables documented και ignored by default",
        "Prisma schema έτοιμο για PostgreSQL",
        "Consent και audit concepts στο data model",
      ],
    },
    faq: {
      eyebrow: "FAQ",
      title: "Πρακτικές απαντήσεις για την πρώτη φάση.",
      items: [
        {
          question: "Το Northline αντικαθιστά salespeople;",
          answer:
            "Όχι. Βοηθά την ομάδα να καταγράφει και να αξιολογεί inbound demand, μετά δρομολογεί το lead σε booking, CRM, webhook ή άνθρωπο όταν αυτό είναι το σωστό επόμενο βήμα.",
        },
        {
          question: "Ποια κανάλια προβλέπονται;",
          answer:
            "Η αρχιτεκτονική προετοιμάζεται για website chat, WhatsApp, Instagram, Facebook Messenger, Viber, email και API channels. Δεν απαιτούνται credentials για το πρώτο local build.",
        },
        {
          question: "Μπορεί να υποστηρίξει διαφορετικά industries;",
          answer:
            "Ναι. Το core qualification model είναι broad και αργότερα μπορούν να προστεθούν industry templates με ειδικές ερωτήσεις, knowledge sources και routing policies.",
        },
      ],
    },
    finalCta: {
      eyebrow: "Preview only",
      title: "Ξεκινήστε από την inbound lead ροή.",
      body:
        "Το rebuild έχει πλέον καθαρό marketing surface και product foundation για app shell, auth, inbox και channel abstractions.",
    },
    footer: {
      note:
        "Preview-only Northline rebuild. Το υπάρχον live northline.ai production project μένει ανέγγιχτο σε αυτή τη φάση.",
      styleGuide: "Style guide",
    },
  },
};
