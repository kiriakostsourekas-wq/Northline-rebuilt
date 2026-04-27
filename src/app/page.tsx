import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Inbound lead handling for chat and messaging",
  description:
    "Northline replies to inbound leads, asks follow-up questions, suggests booking, and routes clean lead data to your team.",
  path: "/",
});

export default function Home() {
  return <MarketingPage locale="en" />;
}
