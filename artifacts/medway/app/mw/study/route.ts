import { NextRequest, NextResponse } from "next/server";
import { generateStudyGuide } from "@/lib/ai";
import { getWikipediaSummaryForQuery } from "@/lib/wikipedia";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const context = await getWikipediaSummaryForQuery(query);
    const data = await generateStudyGuide(query, context);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Study guide route error:", err);
    return NextResponse.json(
      { error: "Failed to generate study guide" },
      { status: 500 }
    );
  }
}
