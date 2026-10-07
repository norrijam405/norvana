import type { MetadataRoute } from "next";

const BASE_URL = "https://acreera.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "", priority: 1, changeFrequency: "daily" as const },
    { path: "/market", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/partners", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/era-drops", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/growers", priority: 0.7, changeFrequency: "weekly" as const },
    { path: "/archive", priority: 0.5, changeFrequency: "weekly" as const },
  ];

  return routes.map((route) => ({
    url: BASE_URL + route.path,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
