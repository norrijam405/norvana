import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { progressNotes } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const format = req.nextUrl.searchParams.get("format") || "json";
    const all = await db.select().from(progressNotes).orderBy(desc(progressNotes.createdAt));

    if (format === "markdown") {
      let md = "# NORVANA Progress Notes\n\n";
      md += `Generated: ${new Date().toISOString()}\n\n---\n\n`;
      for (const note of all) {
        md += `## ${note.title}\n`;
        md += `- **Type:** ${note.type}\n`;
        md += `- **Status:** ${note.status}\n`;
        md += `- **Priority:** ${note.priority}\n`;
        md += `- **Category:** ${note.category}\n`;
        if (note.dueDate) md += `- **Due:** ${note.dueDate}\n`;
        md += `\n${note.content}\n\n---\n\n`;
      }
      return new NextResponse(md, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": "attachment; filename=norvana-progress.md",
        },
      });
    }

    return NextResponse.json(all);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
