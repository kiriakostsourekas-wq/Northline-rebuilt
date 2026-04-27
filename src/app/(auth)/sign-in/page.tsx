import type { Metadata } from "next";
import { signInAction } from "@/app/(auth)/actions";
import { AuthCard, AuthLink } from "@/components/app/auth-card";
import { AuthField, AuthSubmit } from "@/components/app/auth-fields";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Northline.",
};

type SignInPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Sign in"
      body="Continue configuring your workspace or return to the dashboard."
      error={params?.error}
      footer={
        <>
          No account yet? <AuthLink href="/sign-up">Create one</AuthLink>
          {" · "}
          <AuthLink href="/reset-password">Reset password</AuthLink>
        </>
      }
    >
      <form action={signInAction} className="grid gap-4">
        <AuthField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
        <AuthSubmit>Sign in</AuthSubmit>
      </form>
    </AuthCard>
  );
}
