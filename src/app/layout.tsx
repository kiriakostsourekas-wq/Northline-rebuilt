import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans } from "next/font/google";
import { AnalyticsListener } from "@/components/marketing/analytics-listener";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin", "greek"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://northline.ai";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Northline | AI sales assistant for inbound leads",
    template: "%s | Northline",
  },
  description:
    "Northline helps businesses capture, qualify, book, route, and hand off inbound leads from website chat and messaging channels.",
  openGraph: {
    title: "Northline",
    description:
      "AI sales assistant for inbound leads across website chat and messaging channels.",
    siteName: "Northline",
    url: appUrl,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${notoSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AnalyticsListener />
        {children}
      </body>
    </html>
  );
}
