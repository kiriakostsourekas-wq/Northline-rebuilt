import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/marketing/brand-mark";

type AuthCardProps = {
  title: string;
  body: string;
  error?: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthCard({ title, body, error, children, footer }: AuthCardProps) {
  return (
    <main className="grid min-h-screen bg-canvas px-[var(--space-page)] py-10 text-ink">
      <div className="mx-auto grid w-full max-w-md content-center">
        <div className="mb-8">
          <BrandMark href="/" />
        </div>
        <section className="rounded-lg border border-border bg-raised p-6 shadow-card sm:p-8">
          <h1 className="text-title font-black leading-[var(--line-height-title)]">
            {title}
          </h1>
          <p className="mt-3 text-body-sm leading-6 text-muted">{body}</p>
          {error ? (
            <div
              role="alert"
              className="mt-5 rounded-md border border-rose/25 bg-rose-soft p-4 text-body-sm font-bold text-rose"
            >
              {error}
            </div>
          ) : null}
          <div className="mt-6">{children}</div>
        </section>
        <p className="mt-6 text-center text-body-sm text-muted">{footer}</p>
      </div>
    </main>
  );
}

type AuthLinkProps = {
  href: string;
  children: ReactNode;
};

export function AuthLink({ href, children }: AuthLinkProps) {
  return (
    <Link href={href} className="font-bold text-teal hover:text-teal-strong">
      {children}
    </Link>
  );
}
