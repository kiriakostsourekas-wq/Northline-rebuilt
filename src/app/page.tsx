import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "AI sales assistant for inbound leads",
  description:
    "Northline replies to inbound inquiries, qualifies prospects, helps book meetings, and prepares lead data for business systems.",
  path: "/",
});

export default function Home() {
  return <MarketingPage locale="en" />;
}
