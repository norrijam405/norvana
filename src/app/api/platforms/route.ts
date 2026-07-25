import { NextResponse } from "next/server";
import { SUPPORTED_PLATFORMS } from "@/lib/supplier-integrations";

export async function GET() {
  return NextResponse.json(SUPPORTED_PLATFORMS);
}
