import {
  Camera,
  Globe2,
  Mail,
  MessageCircle,
  MessagesSquare,
  Send,
  Smartphone,
} from "lucide-react";
import type { ChannelTypeValue } from "@/lib/channels/types";

const channelMeta: Record<
  ChannelTypeValue,
  { label: string; icon: typeof Globe2; tone: string }
> = {
  WEBSITE_CHAT: {
    label: "Website",
    icon: Globe2,
    tone: "bg-teal-soft text-teal-strong",
  },
  WHATSAPP: {
    label: "WhatsApp",
    icon: MessageCircle,
    tone: "bg-emerald-50 text-emerald-700",
  },
  INSTAGRAM: {
    label: "Instagram",
    icon: Camera,
    tone: "bg-rose-soft text-rose",
  },
  FACEBOOK_MESSENGER: {
    label: "Messenger",
    icon: MessagesSquare,
    tone: "bg-slate-soft text-slate",
  },
  TELEGRAM: {
    label: "Telegram",
    icon: Send,
    tone: "bg-sky-50 text-sky-700",
  },
  VIBER: {
    label: "Viber",
    icon: Smartphone,
    tone: "bg-violet-50 text-violet-700",
  },
  EMAIL: {
    label: "Email",
    icon: Mail,
    tone: "bg-amber-soft text-amber",
  },
  API: {
    label: "API",
    icon: Send,
    tone: "bg-subtle text-muted",
  },
};

export function ChannelBadge({ type }: { type?: string | null }) {
  const meta = channelMeta[(type ?? "API") as ChannelTypeValue] ?? channelMeta.API;
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-md px-2.5 py-1 text-caption font-black ${meta.tone}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {meta.label}
    </span>
  );
}

export function formatChannelType(type?: string | null) {
  return channelMeta[(type ?? "API") as ChannelTypeValue]?.label ?? "Unknown";
}
