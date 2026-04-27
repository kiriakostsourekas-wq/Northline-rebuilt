import Link from "next/link";
import type { ReactNode } from "react";
import { AppNav } from "@/components/app/app-nav";
import { BrandMark } from "@/components/marketing/brand-mark";

type AppShellProps = {
  children: ReactNode;
  workspaceName: string;
  userName?: string | null;
  role: string;
};

export function AppShell({
  children,
  workspaceName,
  userName,
  role,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-40 border-b border-border bg-canvas/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-[var(--space-page)] py-4">
          <BrandMark href="/app/dashboard" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-body-sm font-black">{workspaceName}</p>
              <p className="text-caption font-bold uppercase text-muted">
                {userName || "Workspace user"} / {formatRole(role)}
              </p>
            </div>
            <Link
              href="/sign-out"
              className="rounded-md border border-border bg-raised px-3 py-2 text-caption font-black text-ink transition-colors hover:border-teal/45"
            >
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-[var(--space-page)] py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border border-border bg-raised p-3 shadow-card lg:sticky lg:top-24 lg:h-fit">
          <AppNav />
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}

function formatRole(value: string) {
  return value.replaceAll("_", " ").toLowerCase();
}
