import { describe, expect, it } from "vitest";
import {
  deletedText,
  normalizeDataSubjectSelector,
} from "@/lib/privacy/data-subject";

describe("data subject helpers", () => {
  it("normalizes email and phone selectors", () => {
    expect(normalizeDataSubjectSelector(" MARIA@EXAMPLE.COM ")).toEqual({
      type: "email",
      value: "maria@example.com",
    });
    expect(normalizeDataSubjectSelector("+30 690 123 4567")).toEqual({
      type: "phone",
      value: "+306901234567",
    });
  });

  it("rejects weak selectors and produces explicit deletion markers", () => {
    expect(normalizeDataSubjectSelector("maria")).toBeNull();
    expect(deletedText(new Date("2026-04-26T10:00:00.000Z"))).toContain(
      "2026-04-26T10:00:00.000Z",
    );
  });
});
