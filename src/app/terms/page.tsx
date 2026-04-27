import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { legalPages } from "@/content/website";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Terms",
  description: "Terms for the Northline preview marketing website.",
  path: "/terms",
});

export default function TermsRoute() {
  return <LegalPage {...legalPages.terms} />;
}
