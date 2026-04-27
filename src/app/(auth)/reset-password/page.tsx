import type { Metadata } from "next";
import { requestPasswordResetAction } from "@/app/(auth)/actions";
import { AuthCard, AuthLink } from "@/components/app/auth-card";
import { AuthField, AuthSubmit } from "@/components/app/auth-fields";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Request a Northline password reset link.",
};

type ResetPasswordPageProps = {
  searchParams?: Promise<{ sent?: string; error?: string }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const sent = params?.sent === "1";

  return (
    <AuthCard
      title="Reset password"
      body="Enter your email and we will prepare a reset token. Email delivery is not connected in this preview build yet."
      error={params?.error}
      footer={
        <>
          Remembered it? <AuthLink href="/sign-in">Sign in</AuthLink>
        </>
      }
    >
      {sent ? (
        <div className="rounded-md border border-teal/25 bg-teal-soft p-4 text-body-sm font-bold text-teal-strong">
          If an account exists, a reset token has been created. Email delivery
          can be connected in a later preview task.
        </div>
      ) : (
        <form action={requestPasswordResetAction} className="grid gap-4">
          <AuthField
            label="Work email"
            name="email"
            type="email"
            autoComplete="email"
          />
          <AuthSubmit>Prepare reset</AuthSubmit>
        </form>
      )}
    </AuthCard>
  );
}
