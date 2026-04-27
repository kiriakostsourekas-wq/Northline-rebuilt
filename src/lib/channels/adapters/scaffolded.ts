import {
  ChannelAdapterNotConfiguredError,
  type ChannelAdapter,
  type ChannelProvider,
  type ChannelTypeValue,
  type NormalizedInboundEvent,
  type OutboundSendResult,
} from "@/lib/channels/types";

export function createScaffoldedAdapter(input: {
  provider: ChannelProvider;
  channelType: ChannelTypeValue;
  displayName: string;
}): ChannelAdapter {
  return {
    ...input,
    configured: false,
    verifyWebhook() {
      return {
        ok: false,
        status: 501,
        message: `${input.displayName} webhook verification is scaffolded and waiting for credentials.`,
      };
    },
    normalizeInbound(): NormalizedInboundEvent {
      throw new ChannelAdapterNotConfiguredError(input.provider);
    },
    async sendMessage(): Promise<OutboundSendResult> {
      return {
        ok: false,
        retryable: false,
        errorMessage: `${input.displayName} adapter is not configured yet.`,
      };
    },
  };
}
