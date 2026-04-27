const redacted = "[redacted]";

export function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (Array.isArray(value)) return value.map(sanitizeLogValue);
  if (value instanceof Date) return value.toISOString();
  if (!value || typeof value !== "object") return undefined;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? redacted : sanitizeLogValue(item),
    ]),
  );
}

export function safeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error.";
  return redactString(message).slice(0, 500);
}

function redactString(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, redacted)
    .replace(/\+?\d[\d\s().-]{7,}\d/g, redacted)
    .replace(
      /(secret|token|password|authorization|api[_-]?key)=([^&\s]+)/gi,
      `$1=${redacted}`,
    );
}

function isSensitiveKey(key: string) {
  return /(password|secret|token|authorization|cookie|api[_-]?key|email|phone|name)/i.test(
    key,
  );
}
