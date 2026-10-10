import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Acre Era",
    short_name: "Acre Era",
    description:
      "Fresh food, everyday goods, premium finds, and changing Eras in one connected shopping world.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F1E7",
    theme_color: "#2F3026",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/brand/acre-era-social-avatar.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "64x64",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
