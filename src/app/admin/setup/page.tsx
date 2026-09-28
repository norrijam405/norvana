import { notFound } from "next/navigation";
import WatchtowerSetupClient from "@/components/admin/watchtower-setup-client";

export const dynamic = "force-dynamic";

export default function AdminSetupPage() {
  if (process.env.VERCEL_ENV === "production") {
    notFound();
  }

  return <WatchtowerSetupClient />;
}
