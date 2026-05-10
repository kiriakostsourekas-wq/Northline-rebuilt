import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Never lose an inbound lead again",
  description:
    "Northline captures, qualifies, books, and routes inbound leads from website chat and messaging channels.",
  path: "/",
});

export default function Home() {
  return <MarketingPage locale="en" />;
}
