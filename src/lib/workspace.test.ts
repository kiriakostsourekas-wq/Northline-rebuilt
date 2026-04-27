import { describe, expect, it } from "vitest";
import { createWorkspaceSlug } from "./workspace";

describe("workspace utilities", () => {
  it("creates URL-safe workspace slugs with a random suffix", () => {
    const slug = createWorkspaceSlug("Northline Demo Athens!");

    expect(slug).toMatch(/^northline-demo-athens-[a-f0-9]{6}$/);
  });

  it("falls back when a workspace name has no URL-safe characters", () => {
    const slug = createWorkspaceSlug("!!!");

    expect(slug).toMatch(/^workspace-[a-f0-9]{6}$/);
  });
});
