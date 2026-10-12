import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WatchtowerPwaRuntime } from "@/components/admin/watchtower-pwa-runtime";

export const metadata: Metadata = {
  applicationName: "Acre Era Watchtower",
  manifest: "/watchtower.webmanifest",
  themeColor: "#0d0f0c",
  appleWebApp: {
    capable: true,
    title: "Watchtower",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/watchtower-icon.svg",
    apple: "/watchtower-icon.svg",
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <WatchtowerPwaRuntime />
      <div className="pb-20 md:pb-0">{children}</div>
    </>
  );
}
