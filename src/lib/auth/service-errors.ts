import { Prisma } from "@/generated/prisma/client";

export const authServiceUnavailableMessage =
  "Sign-in is temporarily unavailable. Please try again shortly. Η σύνδεση είναι προσωρινά μη διαθέσιμη. Δοκιμάστε ξανά σε λίγο.";

const prismaServiceFailureCodes = new Set([
  "P1000",
  "P1001",
  "P1002",
  "P1003",
  "P1008",
  "P1009",
  "P1010",
  "P1011",
  "P1012",
  "P1013",
  "P1014",
  "P1015",
  "P1017",
  "P2021",
  "P2022",
  "P2024",
]);

const postgresServiceFailureCodes = new Set([
  "08000",
  "08001",
  "08003",
  "08004",
  "08006",
  "08007",
  "08P01",
  "28P01",
  "3D000",
  "3F000",
  "42703",
  "42P01",
  "53300",
  "53400",
  "57P01",
  "57P02",
  "57P03",
]);

const networkServiceFailureCodes = new Set([
  "EAI_AGAIN",
  "ECONNABORTED",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "ETIMEDOUT",
]);

export function isAuthServiceFailure(error: unknown): boolean {
  return isAuthServiceFailureWithDepth(error, 0);
}

function isAuthServiceFailureWithDepth(error: unknown, depth: number): boolean {
  if (!error || typeof error !== "object") return false;

  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return true;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    prismaServiceFailureCodes.has(error.code)
  ) {
    return true;
  }

  const code = getStringProperty(error, "code");
  if (
    code &&
    (prismaServiceFailureCodes.has(code) ||
      postgresServiceFailureCodes.has(code) ||
      networkServiceFailureCodes.has(code))
  ) {
    return true;
  }

  if (
    error instanceof Error &&
    error.message ===
      "DATABASE_URL is required before accessing the Northline database."
  ) {
    return true;
  }

  const cause = getCause(error);
  if (cause && depth < 3) {
    return isAuthServiceFailureWithDepth(cause, depth + 1);
  }

  return false;
}

function getStringProperty(error: object, key: string) {
  const value = (error as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function getCause(error: object) {
  return (error as { cause?: unknown }).cause;
}
