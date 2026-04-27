export type DataSubjectSelector =
  | { type: "email"; value: string }
  | { type: "phone"; value: string };

export function normalizeDataSubjectSelector(
  value: string,
): DataSubjectSelector | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const email = trimmed.toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { type: "email", value: email };
  }

  const phone = trimmed.replace(/[^\d+]/g, "");
  if (phone.replace(/\D/g, "").length >= 8) {
    return { type: "phone", value: phone };
  }

  return null;
}

export function deletedText(deletedAt: Date) {
  return `[deleted for data subject request at ${deletedAt.toISOString()}]`;
}

export function safeExportJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
