import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";
import { legalPages } from "@/content/website";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  description:
    "Privacy notice for Northline preview demo, waitlist, and contact submissions.",
  path: "/privacy",
});

export default function PrivacyRoute() {
  return <LegalPage {...legalPages.privacy} />;
}
