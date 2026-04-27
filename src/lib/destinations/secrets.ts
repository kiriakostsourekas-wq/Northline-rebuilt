import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const algorithm = "aes-256-gcm";
const localPreviewKeyMaterial = "northline-local-preview-secret-key-material";

export function encryptSecret(value: string) {
  if (!value) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv(algorithm, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value?: string | null) {
  if (!value) return null;
  const [version, iv, tag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted) {
    throw new Error("Unsupported destination secret format.");
  }
  const decipher = createDecipheriv(
    algorithm,
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function secretLast4(value?: string | null) {
  if (!value) return null;
  return value.slice(-4);
}

export function verifySecret(value: string, encrypted?: string | null) {
  const decrypted = decryptSecret(encrypted);
  if (!decrypted) return false;
  const left = Buffer.from(value);
  const right = Buffer.from(decrypted);
  return left.length === right.length && timingSafeEqual(left, right);
}

function getEncryptionKey() {
  const configured = process.env.NORTHLINE_SECRET_ENCRYPTION_KEY;
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error(
      "NORTHLINE_SECRET_ENCRYPTION_KEY is required for production secret storage.",
    );
  }

  return createHash("sha256")
    .update(configured || localPreviewKeyMaterial)
    .digest();
}
