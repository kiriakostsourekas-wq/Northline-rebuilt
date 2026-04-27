export const designTokens = {
  colors: [
    {
      name: "Canvas",
      token: "--color-canvas",
      swatch: "bg-canvas",
      usage: "Primary page background",
    },
    {
      name: "Raised",
      token: "--color-raised",
      swatch: "bg-raised",
      usage: "Panels, cards, navigation",
    },
    {
      name: "Subtle",
      token: "--color-subtle",
      swatch: "bg-subtle",
      usage: "Bands and quiet fills",
    },
    {
      name: "Ink",
      token: "--color-ink",
      swatch: "bg-ink",
      usage: "Primary text and dark CTA surfaces",
    },
    {
      name: "Muted",
      token: "--color-muted",
      swatch: "bg-muted",
      usage: "Secondary copy",
    },
    {
      name: "Teal",
      token: "--color-teal",
      swatch: "bg-teal",
      usage: "Primary action and positive state",
    },
    {
      name: "Blue",
      token: "--color-blue",
      swatch: "bg-blue",
      usage: "Operational/product accents",
    },
    {
      name: "Amber",
      token: "--color-amber",
      swatch: "bg-amber",
      usage: "Attention and next-action signals",
    },
    {
      name: "Rose",
      token: "--color-rose",
      swatch: "bg-rose",
      usage: "Risk and escalation states",
    },
    {
      name: "Violet",
      token: "--color-violet",
      swatch: "bg-violet",
      usage: "Knowledge and automation accents",
    },
  ],
  typography: [
    {
      name: "Display XL",
      token: "--font-size-display-xl",
      className: "text-display-xl",
      sample: "Northline",
    },
    {
      name: "Display",
      token: "--font-size-display",
      className: "text-display",
      sample: "Inbound lead operations",
    },
    {
      name: "Title large",
      token: "--font-size-title-lg",
      className: "text-title-lg",
      sample: "Qualify every conversation",
    },
    {
      name: "Title",
      token: "--font-size-title",
      className: "text-title",
      sample: "Routing, booking, and handoff",
    },
    {
      name: "Body",
      token: "--font-size-body",
      className: "text-body",
      sample: "Clear copy for operators and owners.",
    },
    {
      name: "Caption",
      token: "--font-size-caption",
      className: "text-caption",
      sample: "STATUS: SALES READY",
    },
  ],
  spacing: [
    { name: "Page gutter", token: "--space-page", usage: "Responsive page padding" },
    { name: "Section", token: "--space-section", usage: "Standard vertical rhythm" },
    {
      name: "Section tight",
      token: "--space-section-tight",
      usage: "Dense product and proof sections",
    },
  ],
  radii: [
    { name: "XS", token: "--radius-xs", usage: "Small badges and controls" },
    { name: "SM", token: "--radius-sm", usage: "Inputs and compact panels" },
    { name: "MD", token: "--radius-md", usage: "Cards and buttons" },
    { name: "LG", token: "--radius-lg", usage: "Large panels, capped at 8px" },
  ],
  elevation: [
    { name: "Card", token: "--shadow-card", usage: "Subtle card lift" },
    { name: "Soft", token: "--shadow-soft", usage: "Hero product surfaces" },
    { name: "Focus", token: "--shadow-focus", usage: "Accessible focus state" },
  ],
  borders: [
    { name: "Hairline", token: "--border-hairline", usage: "Default separators" },
    { name: "Strong", token: "--border-strong", usage: "Emphasized panels" },
  ],
  motion: [
    { name: "Duration", token: "--motion-duration", usage: "Default UI transition" },
    { name: "Ease", token: "--motion-ease", usage: "Default transition curve" },
  ],
} as const;
