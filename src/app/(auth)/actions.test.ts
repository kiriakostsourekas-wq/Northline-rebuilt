import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authServiceUnavailableMessage } from "@/lib/auth/service-errors";

const mocks = vi.hoisted(() => {
  class RedirectError extends Error {
    digest: string;
    url: string;

    constructor(url: string) {
      super(`Redirected to ${url}`);
      this.name = "RedirectError";
      this.digest = `NEXT_REDIRECT;replace;${url};307;`;
      this.url = url;
    }
  }

  return {
    createSession: vi.fn(),
    findOrganization: vi.fn(),
    findUser: vi.fn(),
    getOnboardingStepByEnum: vi.fn(),
    getPrismaClient: vi.fn(),
    rateLimitByRequest: vi.fn(),
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
    verifyPassword: vi.fn(),
    writeAuditLog: vi.fn(),
  };
});

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/server/db", () => ({
  getPrismaClient: mocks.getPrismaClient,
}));

vi.mock("@/lib/security/request", () => ({
  rateLimitByRequest: mocks.rateLimitByRequest,
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: mocks.createSession,
  hashSessionToken: (token: string) => `hashed:${token}`,
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async () => "hashed-password"),
  validatePassword: vi.fn(() => null),
  verifyPassword: mocks.verifyPassword,
}));

vi.mock("@/lib/onboarding", () => ({
  getOnboardingStepByEnum: mocks.getOnboardingStepByEnum,
}));

vi.mock("@/lib/workspace", () => ({
  createWorkspaceForOwner: vi.fn(),
}));

vi.mock("@/server/audit/service", () => ({
  writeAuditLog: mocks.writeAuditLog,
}));

const { signInAction } = await import("@/app/(auth)/actions");

describe("signInAction", () => {
  let consoleErrorSpy: { mockRestore: () => void };

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    mocks.rateLimitByRequest.mockResolvedValue({
      allowed: true,
      remaining: 7,
      resetAt: new Date("2026-05-09T00:00:00.000Z"),
    });
    mocks.getPrismaClient.mockReturnValue({
      organization: { findUnique: mocks.findOrganization },
      user: { findUnique: mocks.findUser },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("redirects to a controlled service unavailable error when user lookup cannot reach the database", async () => {
    mocks.findUser.mockRejectedValue(
      Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      }),
    );

    await expect(signInAction(signInForm())).rejects.toMatchObject({
      url: expectedSignInError(authServiceUnavailableMessage),
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "northline.auth.sign_in_unavailable",
      { message: "connect ECONNREFUSED" },
    );
  });

  it("redirects to a controlled service unavailable error when the auth table is missing", async () => {
    mocks.findUser.mockRejectedValue(
      Object.assign(new Error("The table public.User does not exist"), {
        code: "P2021",
      }),
    );

    await expect(signInAction(signInForm())).rejects.toMatchObject({
      url: expectedSignInError(authServiceUnavailableMessage),
    });
    expect(mocks.verifyPassword).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "northline.auth.sign_in_unavailable",
      { message: "The table public.User does not exist" },
    );
  });

  it("keeps invalid password failures on the invalid credentials path", async () => {
    mocks.findUser.mockResolvedValue(testUser());
    mocks.verifyPassword.mockResolvedValue(false);

    await expect(signInAction(signInForm())).rejects.toMatchObject({
      url: expectedSignInError("Invalid email or password."),
    });
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("redirects to a controlled service unavailable error when session creation fails", async () => {
    mocks.findUser.mockResolvedValue(testUser());
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockRejectedValue(
      Object.assign(new Error("connection pool timeout"), { code: "P2024" }),
    );

    await expect(signInAction(signInForm())).rejects.toMatchObject({
      url: expectedSignInError(authServiceUnavailableMessage),
    });
    expect(mocks.writeAuditLog).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "northline.auth.sign_in_unavailable",
      { message: "connection pool timeout" },
    );
  });

  it("redirects to a controlled service unavailable error when onboarding lookup fails", async () => {
    mocks.findUser.mockResolvedValue(testUser());
    mocks.verifyPassword.mockResolvedValue(true);
    mocks.createSession.mockResolvedValue(undefined);
    mocks.writeAuditLog.mockResolvedValue(undefined);
    mocks.findOrganization.mockRejectedValue(
      Object.assign(new Error("database is starting up"), { code: "57P03" }),
    );

    await expect(signInAction(signInForm())).rejects.toMatchObject({
      url: expectedSignInError(authServiceUnavailableMessage),
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "northline.auth.sign_in_unavailable",
      { message: "database is starting up" },
    );
  });
});

function signInForm() {
  const formData = new FormData();
  formData.set("email", "owner@example.com");
  formData.set("password", "Northline2026");
  return formData;
}

function testUser() {
  return {
    id: "user_1",
    organizationId: "org_1",
    passwordHash: "stored-password-hash",
  };
}

function expectedSignInError(message: string) {
  return `/sign-in?error=${encodeURIComponent(message)}`;
}
