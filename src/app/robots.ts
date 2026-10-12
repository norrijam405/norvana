import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/watchtower"],
      },
    ],
    sitemap: "https://acreera.com/sitemap.xml",
    host: "https://acreera.com",
  };
}
