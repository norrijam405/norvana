import { NextRequest, NextResponse } from "next/server";
import { SCOUT_PRODUCTS } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Simple keyword-based responses simulating AI scout
    const lower = message?.toLowerCase() || "";
    let response = "";
    let recommendations = SCOUT_PRODUCTS;

    if (lower.includes("trending") || lower.includes("trend")) {
      recommendations = SCOUT_PRODUCTS.filter((p) => p.trendScore > 80);
      response = `Here are the top trending products with scores above 80. The **${recommendations[0].name}** leads with a trend score of ${recommendations[0].trendScore}/100.`;
    } else if (lower.includes("margin") || lower.includes("profit")) {
      recommendations = [...SCOUT_PRODUCTS].sort((a, b) => parseInt(b.margin) - parseInt(a.margin));
      response = `Sorted by profit margin — **${recommendations[0].name}** has the highest margin at ${recommendations[0].margin}. Great for maximizing revenue.`;
    } else if (lower.includes("bestseller") || lower.includes("best")) {
      recommendations = SCOUT_PRODUCTS.filter((p) => p.badge === "bestseller");
      response = `These are our proven bestsellers based on sales velocity and customer ratings. All have consistent demand.`;
    } else if (lower.includes("new") || lower.includes("arrival")) {
      recommendations = SCOUT_PRODUCTS.filter((p) => p.badge === "new");
      response = `Fresh arrivals showing strong early signals. Consider adding these to your next volume.`;
    } else {
      response = `Here's an overview of all scouted products. Ask about "trending", "margins", "bestsellers", or "new arrivals" for filtered results.`;
    }

    return NextResponse.json({ response, recommendations });
  } catch (error) {
    console.error("Scout error:", error);
    return NextResponse.json({ error: "Scout failed" }, { status: 500 });
  }
}
