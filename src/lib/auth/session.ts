import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { getPrismaClient } from "@/server/db";

export const sessionCookieName = "northline_session";
const sessionDurationMs = 1000 * 60 * 60 * 24 * 14;

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function shouldUseSecureSessionCookie() {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.VERCEL_ENV) return true;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return true;

  return !appUrl.startsWith("http://localhost") &&
    !appUrl.startsWith("http://127.0.0.1");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + sessionDurationMs);
  const prisma = getPrismaClient();

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureSessionCookie(),
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const prisma = getPrismaClient();
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          organization: {
            include: {
              onboarding: true,
              businessProfile: true,
            },
          },
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    const prisma = getPrismaClient();
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(sessionCookieName);
}
