import type { ReactNode } from "react";
import { AppShell } from "@/components/app/app-shell";
import { requireCurrentUser } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function ProtectedAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, organization } = await requireCurrentUser();

  return (
    <AppShell
      workspaceName={organization.name}
      userName={user.name}
      role={user.role}
    >
      {children}
    </AppShell>
  );
}
