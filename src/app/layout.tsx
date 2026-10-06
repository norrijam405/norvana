import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { Navbar } from "@/components/navbar";
import { CartDrawer } from "@/components/cart-drawer";

export const metadata: Metadata = {
  title: "Acre Era — From open roads to city lights.",
  description:
    "Fresh food, everyday goods, premium finds, and rotating Eras in one connected shopping world.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="impact-site-verification" content="e040bd52-d6b3-4493-83dc-3d4a50b826db" />
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
