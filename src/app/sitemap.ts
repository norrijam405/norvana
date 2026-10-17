import type { MetadataRoute } from "next";
import { publicIndexingEnabled, publicSiteUrl } from "@/lib/public-site-url";



export default function sitemap(): MetadataRoute.Sitemap {
  if (!publicIndexingEnabled()) return [];
  const now = new Date();
  const routes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/market", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/partners", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/era-drops", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/growers", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/archive", priority: 0.5, changeFrequency: "weekly" as const },
  ];

  return routes.map((route) => ({
    url: publicSiteUrl() + route.path,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
