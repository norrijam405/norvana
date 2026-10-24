import type { MetadataRoute } from "next";
import { publicIndexingEnabled, publicSiteUrl } from "@/lib/public-site-url";

export default function robots(): MetadataRoute.Robots {
  if (!publicIndexingEnabled()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/watchtower"],
      },
    ],
    sitemap: publicSiteUrl() + "/sitemap.xml",
    host: publicSiteUrl(),
  };
}
