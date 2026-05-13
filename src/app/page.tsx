import type { Metadata } from "next";
import { MarketingPage } from "@/components/marketing/marketing-page";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Turn missed chats into qualified leads",
  description:
    "Northline replies in Greek and English, qualifies inbound leads, and routes each conversation to booking, CRM, or a human handoff.",
  path: "/",
});

export default function Home() {
  return <MarketingPage locale="en" />;
}
