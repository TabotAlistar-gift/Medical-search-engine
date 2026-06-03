import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/lib/ai";

export async function GET(req: NextRequest) {
  const prefix = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (prefix.length < 2) {
    return NextResponse.json([]);
  }
  const suggestions = await getSuggestions(prefix);
  return NextResponse.json(suggestions, {
    headers: { "Cache-Control": "public, s-maxage=300" },
  });
}
