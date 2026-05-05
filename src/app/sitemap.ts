import type { MetadataRoute } from "next";
import { getPublicAppUrl } from "@/lib/app-url";

const publicRoutes = ["/", "/pricing", "/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = getPublicAppUrl();
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${appUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
