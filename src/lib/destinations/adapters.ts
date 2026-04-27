import { createHmac } from "node:crypto";
import { decryptSecret } from "@/lib/destinations/secrets";
import { stableStringify } from "@/lib/destinations/payload";
import { safeErrorMessage, sanitizeLogValue } from "@/lib/security/logging";
import type {
  DestinationSnapshot,
  ExportPayload,
  WebhookDeliveryResult,
} from "@/lib/destinations/types";

export type CrmAdapter = {
  provider: string;
  deliver(input: {
    destination: DestinationSnapshot;
    payload: ExportPayload;
    exportId: string;
    idempotencyKey: string;
  }): Promise<WebhookDeliveryResult>;
};

export function getCrmAdapter(provider: string): CrmAdapter {
  if (provider === "WEBHOOK") return webhookAdapter;
  return createStubAdapter(provider);
}

export const webhookAdapter: CrmAdapter = {
  provider: "WEBHOOK",
  async deliver(input) {
    if (!input.destination.endpointUrl) {
      return {
        status: "FAILED",
        errorMessage: "Webhook endpoint URL is missing.",
        retryable: false,
      };
    }

    const body = stableStringify(input.payload);
    const secret = decryptSecret(input.destination.secretEncrypted);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Northline-Preview-Exporter/1.0",
      "X-Northline-Export-Id": input.exportId,
      "X-Northline-Idempotency-Key": input.idempotencyKey,
      ...(input.destination.headers ?? {}),
    };

    if (secret) {
      headers["X-Northline-Signature"] = `sha256=${createHmac("sha256", secret)
        .update(body)
        .digest("hex")}`;
    }

    try {
      const response = await fetch(input.destination.endpointUrl, {
        method: "POST",
        headers,
        body,
      });
      const responseBody = sanitizeResponseBody(await response.text());

      if (response.ok) {
        return {
          status: "DELIVERED",
          responseStatus: response.status,
          responseBody,
          retryable: false,
        };
      }

      return {
        status: isRetryableStatus(response.status) ? "RETRYING" : "FAILED",
        responseStatus: response.status,
        responseBody,
        errorMessage: `Webhook returned HTTP ${response.status}.`,
        retryable: isRetryableStatus(response.status),
      };
    } catch (error) {
      return {
        status: "RETRYING",
        errorMessage: safeErrorMessage(error),
        retryable: true,
      };
    }
  },
};

function createStubAdapter(provider: string): CrmAdapter {
  return {
    provider,
    async deliver() {
      return {
        status: "FAILED",
        errorMessage: `${provider} adapter is scaffolded but not configured for live delivery yet.`,
        retryable: false,
      };
    },
  };
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}

function sanitizeResponseBody(value: string) {
  return truncate(String(sanitizeLogValue(value)), 2000);
}
