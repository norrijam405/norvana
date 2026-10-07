import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { Navbar } from "@/components/navbar";
import { CartDrawer } from "@/components/cart-drawer";

export const metadata: Metadata = {
  metadataBase: new URL("https://acreera.com"),
  title: {
    default: "Acre Era — Fresh food, everyday goods, and premium finds",
    template: "%s | Acre Era",
  },
  description:
    "Fresh food, everyday goods, premium finds, and changing Eras in one connected shopping world.",
  applicationName: "Acre Era",
  openGraph: {
    type: "website",
    siteName: "Acre Era",
    url: "https://acreera.com",
    title: "Acre Era — Fresh food, everyday goods, and premium finds",
    description:
      "Fresh food, everyday goods, premium finds, and changing Eras in one connected shopping world.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Acre Era — Fresh food, everyday goods, and premium finds",
    description:
      "Fresh food, everyday goods, premium finds, and changing Eras in one connected shopping world.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="impact-site-verification" content="4af98929-b912-4861-96bb-3361084d8006" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-bone text-obsidian antialiased">
        <CartProvider>
          <Navbar />
          <CartDrawer />
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
