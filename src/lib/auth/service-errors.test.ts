import { describe, expect, it } from "vitest";
import { isAuthServiceFailure } from "./service-errors";

describe("auth service error detection", () => {
  it("treats network and database availability failures as service failures", () => {
    expect(
      isAuthServiceFailure(
        Object.assign(new Error("connect ECONNREFUSED"), {
          code: "ECONNREFUSED",
        }),
      ),
    ).toBe(true);
    expect(
      isAuthServiceFailure(
        Object.assign(new Error("connection pool timeout"), { code: "P2024" }),
      ),
    ).toBe(true);
    expect(
      isAuthServiceFailure(
        new Error(
          "DATABASE_URL is required before accessing the Northline database.",
        ),
      ),
    ).toBe(true);
  });

  it("treats missing Prisma schema and table errors as service failures", () => {
    expect(
      isAuthServiceFailure(
        Object.assign(new Error("The table public.User does not exist"), {
          code: "P2021",
        }),
      ),
    ).toBe(true);
    expect(
      isAuthServiceFailure(
        Object.assign(new Error("Column does not exist"), {
          code: "P2022",
        }),
      ),
    ).toBe(true);
    expect(
      isAuthServiceFailure(
        Object.assign(new Error('relation "User" does not exist'), {
          code: "42P01",
        }),
      ),
    ).toBe(true);
  });

  it("does not treat ordinary auth or data errors as service failures", () => {
    expect(isAuthServiceFailure(new Error("Invalid email or password."))).toBe(
      false,
    );
    expect(
      isAuthServiceFailure(
        Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
      ),
    ).toBe(false);
  });

  it("checks wrapped causes from database adapters", () => {
    expect(
      isAuthServiceFailure(
        Object.assign(new Error("Database request failed"), {
          cause: Object.assign(new Error("server closed connection"), {
            code: "08006",
          }),
        }),
      ),
    ).toBe(true);
  });
});
