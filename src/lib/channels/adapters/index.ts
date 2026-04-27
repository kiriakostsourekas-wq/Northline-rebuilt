import { createScaffoldedAdapter } from "@/lib/channels/adapters/scaffolded";
import { websiteChatAdapter } from "@/lib/channels/adapters/website-chat";
import type { ChannelAdapter, ChannelProvider } from "@/lib/channels/types";

export const channelAdapters = [
  websiteChatAdapter,
  createScaffoldedAdapter({
    provider: "whatsapp",
    channelType: "WHATSAPP",
    displayName: "WhatsApp",
  }),
  createScaffoldedAdapter({
    provider: "instagram",
    channelType: "INSTAGRAM",
    displayName: "Instagram",
  }),
  createScaffoldedAdapter({
    provider: "messenger",
    channelType: "FACEBOOK_MESSENGER",
    displayName: "Messenger",
  }),
  createScaffoldedAdapter({
    provider: "telegram",
    channelType: "TELEGRAM",
    displayName: "Telegram",
  }),
  createScaffoldedAdapter({
    provider: "viber",
    channelType: "VIBER",
    displayName: "Viber",
  }),
  createScaffoldedAdapter({
    provider: "email",
    channelType: "EMAIL",
    displayName: "Email",
  }),
] satisfies ChannelAdapter[];

export function getChannelAdapter(provider: ChannelProvider) {
  return channelAdapters.find((adapter) => adapter.provider === provider) ?? null;
}

export function getChannelAdapterByType(channelType: string) {
  return (
    channelAdapters.find((adapter) => adapter.channelType === channelType) ??
    null
  );
}
