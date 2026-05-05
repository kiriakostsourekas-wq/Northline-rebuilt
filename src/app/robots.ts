import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const appUrl = getPublicAppUrl();
  const isProduction = process.env.VERCEL_ENV === "production";

  return {
    rules: {
      userAgent: "*",
      ...(isProduction ? { allow: "/" } : { disallow: "/" }),
    },
    sitemap: isProduction ? `${appUrl}/sitemap.xml` : undefined,
  };
}
