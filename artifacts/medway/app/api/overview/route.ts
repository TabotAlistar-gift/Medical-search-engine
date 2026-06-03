import { NextRequest, NextResponse } from "next/server";
import { generateOverview } from "@/lib/ai";
import { getWikipediaSummaryForQuery } from "@/lib/wikipedia";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  const context = await getWikipediaSummaryForQuery(query);
  const overview = await generateOverview(query, context);

  return NextResponse.json(overview, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
