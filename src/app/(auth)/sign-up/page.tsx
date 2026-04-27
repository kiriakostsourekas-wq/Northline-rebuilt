import type { Metadata } from "next";
import { signUpAction } from "@/app/(auth)/actions";
import { AuthCard, AuthLink } from "@/components/app/auth-card";
import { AuthField, AuthSubmit } from "@/components/app/auth-fields";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a Northline preview workspace.",
};

type SignUpPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Create your workspace"
      body="Set up a Northline preview account for your business. You will configure the lead workflow next."
      error={params?.error}
      footer={
        <>
          Already have an account? <AuthLink href="/sign-in">Sign in</AuthLink>
        </>
      }
    >
      <form action={signUpAction} className="grid gap-4">
        <AuthField label="Your name" name="name" autoComplete="name" />
        <AuthField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
        />
        <AuthField
          label="Workspace name"
          name="company"
          autoComplete="organization"
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
        />
        <AuthSubmit>Create workspace</AuthSubmit>
      </form>
    </AuthCard>
  );
}
