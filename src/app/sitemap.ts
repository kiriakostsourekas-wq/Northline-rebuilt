import type { MetadataRoute } from "next";

const publicRoutes = ["/", "/pricing", "/about", "/contact", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://northline.ai";
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${appUrl}${route}`,
    lastModified,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
