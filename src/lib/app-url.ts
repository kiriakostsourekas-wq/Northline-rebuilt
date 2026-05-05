const fallbackPublicAppUrl = "https://new-northline.example";

export function getPublicAppUrl(
  env: Record<string, string | undefined> = process.env,
) {
  const candidate = env.NEXT_PUBLIC_APP_URL?.trim();

  if (candidate && isValidPublicUrl(candidate)) {
    return candidate.replace(/\/+$/, "");
  }

  return fallbackPublicAppUrl;
}

export function isValidPublicUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
